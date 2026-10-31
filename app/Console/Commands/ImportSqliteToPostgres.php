<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use PDO;
use RuntimeException;
use Throwable;

class ImportSqliteToPostgres extends Command
{
    /**
     * Tables that are environment-specific or rebuilt by the framework.
     *
     * @var list<string>
     */
    private const SKIP_TABLES = [
        'cache',
        'cache_locks',
        'failed_jobs',
        'job_batches',
        'jobs',
        'migrations',
        'password_reset_tokens',
        'sessions',
        'sqlite_sequence',
    ];

    /**
     * @var string
     */
    protected $signature = 'db:import-sqlite
        {--source=database/database.sqlite : Path to the SQLite database file}
        {--force : Allow the import while APP_ENV=production}
        {--skip-truncate : Append instead of replacing the existing rows}';

    /**
     * @var string
     */
    protected $description = 'Copy the local SQLite data into the configured PostgreSQL (Supabase) database';

    public function handle(): int
    {
        $connection = DB::connection();

        if ($connection->getDriverName() !== 'pgsql') {
            $this->error('The default database connection must be PostgreSQL. Set DB_CONNECTION=pgsql first.');

            return self::FAILURE;
        }

        if (app()->isProduction() && ! $this->option('force')) {
            $this->error('APP_ENV=production. Re-run with --force if you really want to overwrite the production data.');

            return self::FAILURE;
        }

        $path = $this->option('source');

        if (! str_starts_with($path, DIRECTORY_SEPARATOR)) {
            $path = base_path($path);
        }

        if (! is_file($path)) {
            $this->error("SQLite database not found at [{$path}].");

            return self::FAILURE;
        }

        $source = $this->openSqlite($path);

        $schema = $this->currentSchema();
        $destinationTables = $this->destinationTables($schema);

        $tables = $this->tablesToCopy($source, $destinationTables);

        if ($tables === []) {
            $this->warn('No matching tables to copy.');

            return self::SUCCESS;
        }

        $this->line("Source:      {$path}");
        $this->line("Destination: {$schema} (".config('database.connections.'.config('database.default').'.host').')');
        $this->line('Tables:      '.implode(', ', $tables));
        $this->newLine();

        if ($this->option('skip-truncate')) {
            $this->warn('Appending rows. Existing destination rows and unique indexes may cause conflicts.');
        }

        try {
            DB::transaction(function () use ($source, $schema, $tables): void {
                if (! $this->option('skip-truncate')) {
                    $this->truncate($schema, $tables);
                }

                foreach ($tables as $table) {
                    $this->copyTable($source, $schema, $table);
                }

                $this->resetSequences($schema, $tables);
                $this->verifyCounts($source, $schema, $tables);
            });
        } catch (Throwable $exception) {
            $this->newLine();
            $this->error('Import failed and was rolled back: '.$exception->getMessage());

            return self::FAILURE;
        }

        $this->newLine();
        $this->info('Import completed successfully.');

        return self::SUCCESS;
    }

    private function openSqlite(string $path): PDO
    {
        $pdo = new PDO('sqlite:'.$path, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_STRINGIFY_FETCHES => true,
        ]);

        return $pdo;
    }

    private function currentSchema(): string
    {
        $schema = DB::selectOne('select current_schema() as schema')->schema;

        if (! is_string($schema) || $schema === '') {
            throw new RuntimeException('Could not determine the current PostgreSQL schema. Check DB_SEARCH_PATH.');
        }

        return $schema;
    }

    /**
     * @return list<string>
     */
    private function destinationTables(string $schema): array
    {
        $rows = DB::select(
            'select table_name from information_schema.tables where table_schema = ? and table_type = ?',
            [$schema, 'BASE TABLE'],
        );

        return array_map(static fn (object $row): string => $row->table_name, $rows);
    }

    /**
     * @param  list<string>  $destinationTables
     * @return list<string>
     */
    private function tablesToCopy(PDO $source, array $destinationTables): array
    {
        $rows = $source->query(
            "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' order by name"
        )->fetchAll();

        $available = array_map(static fn (array $row): string => $row['name'], $rows);
        $available = array_values(array_intersect($available, $destinationTables));

        $tables = array_values(array_filter(
            $available,
            static fn (string $table): bool => ! in_array($table, self::SKIP_TABLES, true),
        ));

        $missing = array_diff($destinationTables, $this->destinationTablesIn($source));

        foreach ($missing as $table) {
            if (in_array($table, self::SKIP_TABLES, true)) {
                continue;
            }

            $this->warn("Destination table [{$table}] has no SQLite counterpart and will stay empty.");
        }

        return $this->sortByDependencies($source, $tables);
    }

    /**
     * @return list<string>
     */
    private function destinationTablesIn(PDO $source): array
    {
        $rows = $source->query(
            "select name from sqlite_master where type = 'table' and name not like 'sqlite_%'"
        )->fetchAll();

        return array_map(static fn (array $row): string => $row['name'], $rows);
    }

    /**
     * Order tables so that referenced tables are inserted before their children.
     *
     * @param  list<string>  $tables
     * @return list<string>
     */
    private function sortByDependencies(PDO $source, array $tables): array
    {
        $dependencies = [];

        foreach ($tables as $table) {
            $dependencies[$table] = [];

            foreach ($source->query('pragma foreign_key_list('.$this->quoteIdentifier($table).')')->fetchAll() as $foreignKey) {
                $referenced = $foreignKey['table'];

                if ($referenced !== $table && in_array($referenced, $tables, true)) {
                    $dependencies[$table][$referenced] = true;
                }
            }
        }

        $sorted = [];
        $done = [];

        while (count($sorted) < count($tables)) {
            $progressed = false;

            foreach ($tables as $table) {
                if (isset($done[$table])) {
                    continue;
                }

                if (array_diff_key($dependencies[$table], $done) === []) {
                    $sorted[] = $table;
                    $done[$table] = true;
                    $progressed = true;
                }
            }

            if (! $progressed) {
                // Circular references: fall back to the remaining declaration order.
                foreach ($tables as $table) {
                    if (! isset($done[$table])) {
                        $sorted[] = $table;
                        $done[$table] = true;
                    }
                }
            }
        }

        return $sorted;
    }

    /**
     * @param  list<string>  $tables
     */
    private function truncate(string $schema, array $tables): void
    {
        $qualified = array_map(
            fn (string $table): string => $this->qualify($schema, $table),
            $tables,
        );

        DB::statement('truncate table '.implode(', ', $qualified).' restart identity cascade');
    }

    private function copyTable(PDO $source, string $schema, string $table): void
    {
        $destinationColumns = $this->destinationColumns($schema, $table);
        $sourceColumns = array_map(
            static fn (array $column): string => $column['name'],
            $source->query('pragma table_info('.$this->quoteIdentifier($table).')')->fetchAll(),
        );

        $columns = array_values(array_intersect($sourceColumns, array_keys($destinationColumns)));

        if ($columns === []) {
            throw new RuntimeException("Table [{$table}] has no columns in common with the destination.");
        }

        $sourceCount = (int) $source->query(
            'select count(*) from '.$this->quoteIdentifier($table)
        )->fetchColumn();

        if ($sourceCount === 0) {
            $this->line("  {$table}: 0 rows (skipped)");

            return;
        }

        $this->assertDestinationCanAccept($table, $destinationColumns, $columns);

        $select = 'select '.implode(', ', array_map(
            fn (string $column): string => $this->quoteIdentifier($column),
            $columns,
        )).' from '.$this->quoteIdentifier($table);

        $placeholderRow = '('.implode(', ', array_fill(0, count($columns), '?')).')';
        $insertPrefix = 'insert into '.$this->qualify($schema, $table)
            .' ('.implode(', ', array_map(
                fn (string $column): string => $this->quoteIdentifier($column),
                $columns,
            )).') values ';

        $copy = function (array $rows) use ($insertPrefix, $placeholderRow, $columns, $destinationColumns): void {
            $values = [];
            $bindings = [];

            foreach ($rows as $row) {
                $values[] = $placeholderRow;

                foreach ($columns as $column) {
                    $bindings[] = $this->normalize(
                        $row[$column],
                        $destinationColumns[$column],
                    );
                }
            }

            DB::insert($insertPrefix.implode(', ', $values), $bindings);
        };

        $batch = [];
        $copied = 0;
        $statement = $source->query($select);

        while ($row = $statement->fetch()) {
            $batch[] = $row;

            if (count($batch) >= 250) {
                $copy($batch);
                $copied += count($batch);
                $batch = [];
            }
        }

        if ($batch !== []) {
            $copy($batch);
            $copied += count($batch);
        }

        if ($copied !== $sourceCount) {
            throw new RuntimeException("Table [{$table}] copied {$copied} of {$sourceCount} rows.");
        }

        $this->line("  {$table}: {$copied} rows");
    }

    /**
     * @return array<string, string>
     */
    private function destinationColumns(string $schema, string $table): array
    {
        $rows = DB::select(
            'select column_name, data_type, is_nullable, column_default, is_identity
             from information_schema.columns
             where table_schema = ? and table_name = ?
             order by ordinal_position',
            [$schema, $table],
        );

        $columns = [];

        foreach ($rows as $row) {
            $columns[$row->column_name] = $row->data_type;
        }

        return $columns;
    }

    /**
     * @param  array<string, string>  $destinationColumns
     * @param  list<string>  $columns
     */
    private function assertDestinationCanAccept(string $table, array $destinationColumns, array $columns): void
    {
        $rows = DB::select(
            'select column_name, is_nullable, column_default, is_identity
             from information_schema.columns
             where table_schema = current_schema() and table_name = ?',
            [$table],
        );

        foreach ($rows as $row) {
            $hasDefault = $row->column_default !== null || $row->is_identity === 'YES';
            $isRequired = $row->is_nullable === 'NO' && ! $hasDefault;

            if ($isRequired && ! in_array($row->column_name, $columns, true)) {
                throw new RuntimeException(
                    "Table [{$table}] requires [{$row->column_name}] but the SQLite data does not provide it."
                );
            }
        }
    }

    private function normalize(mixed $value, string $dataType): mixed
    {
        if ($value === null) {
            return null;
        }

        if ($dataType === 'boolean') {
            return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? ((string) $value === '1');
        }

        if (in_array($dataType, ['json', 'jsonb'], true)) {
            if ($value === '') {
                return null;
            }

            if (is_string($value)) {
                json_decode($value);

                return json_last_error() === JSON_ERROR_NONE ? $value : json_encode($value);
            }

            return json_encode($value);
        }

        if ($value === '' && ! in_array($dataType, ['text', 'character varying', 'character'], true)) {
            return null;
        }

        return $value;
    }

    /**
     * @param  list<string>  $tables
     */
    private function resetSequences(string $schema, array $tables): void
    {
        foreach ($tables as $table) {
            $rows = DB::select(
                "select column_name
                 from information_schema.columns
                 where table_schema = ? and table_name = ?
                   and (is_identity = 'YES' or column_default like 'nextval(%')",
                [$schema, $table],
            );

            foreach ($rows as $row) {
                $column = $row->column_name;
                $qualified = $this->qualify($schema, $table);
                $sequence = DB::selectOne(
                    'select pg_get_serial_sequence(?, ?) as sequence',
                    [$schema.'.'.$table, $column],
                )->sequence;

                if (! is_string($sequence) || $sequence === '') {
                    continue;
                }

                $max = DB::selectOne(
                    'select max('.$this->quoteIdentifier($column).') as max_value from '.$qualified
                )->max_value;

                if ($max === null) {
                    DB::statement('select setval(?::regclass, 1, false)', [$sequence]);
                } else {
                    DB::statement('select setval(?::regclass, ?, true)', [$sequence, $max]);
                }
            }
        }
    }

    /**
     * @param  list<string>  $tables
     */
    private function verifyCounts(PDO $source, string $schema, array $tables): void
    {
        foreach ($tables as $table) {
            $sourceCount = (int) $source->query(
                'select count(*) from '.$this->quoteIdentifier($table)
            )->fetchColumn();

            $destinationCount = (int) DB::selectOne(
                'select count(*) as count from '.$this->qualify($schema, $table)
            )->count;

            if ($sourceCount !== $destinationCount) {
                throw new RuntimeException(
                    "Row count mismatch for [{$table}]: SQLite {$sourceCount}, Postgres {$destinationCount}."
                );
            }
        }
    }

    private function qualify(string $schema, string $table): string
    {
        return $this->quoteIdentifier($schema).'.'.$this->quoteIdentifier($table);
    }

    private function quoteIdentifier(string $identifier): string
    {
        return '"'.str_replace('"', '""', $identifier).'"';
    }
}
