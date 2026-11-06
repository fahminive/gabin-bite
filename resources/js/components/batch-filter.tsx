import { router } from '@inertiajs/react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type BatchOption = {
    id: number;
    kode: string;
    keterangan: string;
};

type QueryValue = string | number | null | undefined;

interface BatchFilterProps {
    batches: BatchOption[];
    value?: QueryValue;
    url: string;
    extraQuery?: Record<string, QueryValue>;
    className?: string;
}

function compactQuery(query: Record<string, QueryValue>) {
    const data: Record<string, string> = {};

    for (const [key, val] of Object.entries(query)) {
        if (val === undefined || val === null || val === '') {
            continue;
        }

        data[key] = String(val);
    }

    return data;
}

export function BatchFilter({
    batches,
    value,
    url,
    extraQuery = {},
    className,
}: BatchFilterProps) {
    const current = value ? String(value) : 'all';

    function apply(next: string) {
        router.visit(url, {
            data: compactQuery({
                ...extraQuery,
                pre_order_id: next === 'all' ? undefined : next,
            }),
            preserveState: true,
            preserveScroll: true,
        });
    }

    return (
        <Select value={current} onValueChange={apply}>
            <SelectTrigger
                aria-label="Filter batch"
                className={cn(
                    'h-9 w-full rounded-xl bg-card text-xs sm:w-52',
                    className,
                )}
            >
                <SelectValue placeholder="Semua batch" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Semua batch</SelectItem>
                {batches.map((batch) => (
                    <SelectItem key={batch.id} value={String(batch.id)}>
                        {batch.kode} — {batch.keterangan}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
