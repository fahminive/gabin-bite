import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login } from '@/routes';
import {
    ArrowRight,
    BarChart3,
    Check,
    Cookie,
    IceCreamCone,
    Sparkles,
    Star,
    Users,
    Wallet,
} from 'lucide-react';
import GabinMascot from '@/components/gabin-mascot';

const marqueeItems = [
    'Gabin renyah',
    'Es krim lumer',
    'Buku rapi',
    'Anti boncos',
    'Patungan adil',
    'Laporan manis',
];

const features = [
    {
        icon: Cookie,
        title: 'Stok bahan nggak kabur',
        body: 'Bahan masuk, bahan keluar, semua kelihatan. Nggak ada lagi drama “ke mana tepungnya?”.',
        tone: 'bg-accent text-accent-foreground',
    },
    {
        icon: Wallet,
        title: 'Dompet kas aman',
        body: 'Uang masuk dan keluar tercatat rapi. Boncos? Ketahuan sebelum sempat nangis.',
        tone: 'bg-secondary text-secondary-foreground',
    },
    {
        icon: Users,
        title: 'Patungan partner adil',
        body: 'Talangan partner dihitung otomatis. Nggak perlu tarik urat atau bikin grup debat.',
        tone: 'bg-primary/15 text-primary',
    },
    {
        icon: BarChart3,
        title: 'Laporan siap saji',
        body: 'Laba rugi, arus kas, dan posisi keuangan. Tinggal buka, bukan tinggal hafal.',
        tone: 'bg-[#C9B6FF]/40 text-[#4B2FA3]',
    },
];

const steps = [
    {
        number: '01',
        title: 'Bikin batch',
        body: 'Tentukan periode pre-order. Satu batch, satu cerita, satu laporan.',
    },
    {
        number: '02',
        title: 'Catat jualan',
        body: 'Pesanan, pembayaran, dan penyerahan punya status sendiri. Rapi tanpa ribet.',
    },
    {
        number: '03',
        title: 'Ngotak cuan',
        body: 'Lihat laporan, bagi hasil partner, lalu lanjut jualan gabin es krim.',
    },
];

export default function Welcome() {
    const { auth } = usePage().props as any;
    const primaryHref = auth?.user ? dashboard() : login();
    const primaryLabel = auth?.user ? 'Buka Dapur' : 'Masuk Dapur';

    return (
        <>
            <Head title="gabinbite.pwt: Gabin renyah, buku rapi" />

            <div className="relative min-h-svh overflow-hidden bg-background text-foreground">
                {/* decorative background */}
                <div className="pointer-events-none absolute -top-28 -left-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
                <div className="pointer-events-none absolute top-40 -right-24 h-96 w-96 rounded-full bg-accent/40 blur-3xl" />
                <div className="pointer-events-none absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-secondary/40 blur-3xl" />

                {/* nav */}
                <nav className="relative z-20 mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-6">
                    <Link href="/" className="group flex items-center gap-2.5">
                        <img
                            src="/logo-gabinbite.svg"
                            alt="gabinbite.pwt"
                            className="h-11 w-11 -rotate-3 drop-shadow-sm transition-transform duration-300 group-hover:rotate-0"
                        />
                        <div className="leading-none">
                            <div className="font-display text-xl font-extrabold tracking-tight">
                                gabinbite
                                <span className="text-primary">.pwt</span>
                            </div>
                            <div className="mt-1 text-[9px] font-extrabold tracking-[0.22em] uppercase opacity-55">
                                ice cream sandwich
                            </div>
                        </div>
                    </Link>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <a
                            href="#fitur"
                            className="hidden rounded-full px-3 py-2 text-sm font-bold opacity-70 transition hover:bg-muted hover:opacity-100 sm:inline-flex"
                        >
                            Fitur
                        </a>
                        <a
                            href="#cara"
                            className="hidden rounded-full px-3 py-2 text-sm font-bold opacity-70 transition hover:bg-muted hover:opacity-100 sm:inline-flex"
                        >
                            Cara kerja
                        </a>
                        <Link
                            href={primaryHref}
                            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-extrabold text-background shadow-[0_3px_0_0_rgba(59,36,24,0.28)] transition hover:-translate-y-0.5 hover:opacity-90"
                        >
                            {primaryLabel}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </nav>

                {/* hero */}
                <main className="relative z-10 mx-auto max-w-6xl px-5 pt-8 pb-20 sm:pt-14">
                    <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border-2 border-foreground/10 bg-accent px-4 py-1.5 text-[11px] font-extrabold tracking-[0.12em] text-accent-foreground uppercase shadow-[0_4px_0_0_var(--border)]">
                                <Sparkles className="h-3.5 w-3.5" />
                                Sistem pembukuan rasa gabin es krim
                            </div>

                            <h1 className="mt-6 font-display text-5xl leading-[0.95] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                                Gabin{' '}
                                <span className="relative inline-block text-primary">
                                    renyah
                                    <svg
                                        viewBox="0 0 200 16"
                                        className="absolute -bottom-2 left-0 h-4 w-full text-primary/60"
                                        preserveAspectRatio="none"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M3 11c34-8 63-9 95-5 31 4 61 4 99-3"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="6"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </span>
                                ,
                                <br />
                                buku makin{' '}
                                <span className="rounded-2xl bg-secondary px-2 text-secondary-foreground">
                                    rapi
                                </span>
                                .
                            </h1>

                            <p className="mt-7 max-w-xl text-base leading-relaxed font-medium text-muted-foreground sm:text-lg">
                                Kenalin, <strong className="text-foreground">gabinbite.pwt</strong>: dapur
                                digital buat bisnis gabin es krim. Catat bahan, pesanan, kas, dan
                                patungan partner tanpa bikin kepala nge-freeze.
                            </p>

                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <Link
                                    href={primaryHref}
                                    className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-extrabold text-primary-foreground shadow-[0_5px_0_0_rgba(59,36,24,0.28)] transition hover:-translate-y-0.5 hover:opacity-95"
                                >
                                    {primaryLabel}
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                                <a
                                    href="#fitur"
                                    className="inline-flex items-center gap-2 rounded-full border-2 border-foreground/15 bg-card px-6 py-3 text-base font-extrabold shadow-[0_4px_0_0_var(--border)] transition hover:-translate-y-0.5 hover:bg-muted"
                                >
                                    Intip fiturnya
                                </a>
                            </div>

                            <div className="mt-9 flex flex-wrap gap-2.5">
                                {['Biskuit garing', 'Es krim lumer', 'Buku nggak kacau'].map(
                                    (item, index) => (
                                        <span
                                            key={item}
                                            className={`inline-flex items-center gap-1.5 rounded-full border-2 border-foreground/10 bg-card px-3.5 py-1.5 text-xs font-extrabold shadow-[0_3px_0_0_var(--border)] ${
                                                index === 1 ? 'rotate-2' : '-rotate-2'
                                            }`}
                                        >
                                            <Check className="h-3.5 w-3.5 text-primary" />
                                            {item}
                                        </span>
                                    ),
                                )}
                            </div>
                        </div>

                        {/* mascot */}
                        <div className="relative mx-auto w-full max-w-md">
                            <div className="absolute inset-6 rotate-3 rounded-[3rem] bg-primary/20" />
                            <div className="absolute inset-6 -rotate-3 rounded-[3rem] bg-accent/50" />
                            <div className="relative rounded-[3rem] border-4 border-foreground/10 bg-card p-5 shadow-[0_18px_0_-8px_var(--border)] sm:p-8">
                                <GabinMascot className="gabin-float mx-auto h-auto w-full max-w-[360px]" />
                                <div className="mx-auto mt-2 w-fit rounded-full bg-foreground px-4 py-1.5 text-center text-[11px] font-extrabold tracking-[0.08em] text-background uppercase">
                                    crispy di luar, lumer di dalam
                                </div>
                            </div>

                            <div className="gabin-wiggle absolute -top-3 -left-2 rotate-[-6deg] rounded-2xl border-2 border-foreground/10 bg-accent px-3.5 py-2 text-xs font-extrabold text-accent-foreground shadow-[0_4px_0_0_var(--border)]">
                                🍪 biskuit garing
                            </div>
                            <div className="absolute -right-2 top-1/3 rotate-6 rounded-2xl border-2 border-foreground/10 bg-secondary px-3.5 py-2 text-xs font-extrabold text-secondary-foreground shadow-[0_4px_0_0_var(--border)]">
                                🍦 es krim lumer
                            </div>
                            <div className="gabin-wiggle absolute -bottom-4 left-6 rotate-[-3deg] rounded-2xl border-2 border-foreground/10 bg-primary px-3.5 py-2 text-xs font-extrabold text-primary-foreground shadow-[0_4px_0_0_var(--border)]">
                                💸 anti boncos
                            </div>
                        </div>
                    </div>
                </main>

                {/* marquee */}
                <div className="gabin-marquee relative overflow-hidden border-y-4 border-foreground/10 bg-primary py-3.5 text-primary-foreground">
                    <div className="gabin-marquee-track flex w-max items-center gap-7 whitespace-nowrap">
                        {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems].map(
                            (item, index) => (
                                <span
                                    key={`${item}-${index}`}
                                    className="flex items-center gap-7 font-display text-sm font-extrabold tracking-[0.14em] uppercase"
                                >
                                    {item}
                                    <Star className="h-4 w-4 fill-current" />
                                </span>
                            ),
                        )}
                    </div>
                </div>

                {/* features */}
                <section id="fitur" className="relative z-10 mx-auto max-w-6xl px-5 py-20">
                    <div className="mx-auto max-w-2xl text-center">
                        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-[11px] font-extrabold tracking-[0.14em] text-secondary-foreground uppercase">
                            <IceCreamCone className="h-3.5 w-3.5" />
                            fitur dapur
                        </div>
                        <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                            Yang bikin dapur makin happy
                        </h2>
                        <p className="mt-3 font-medium text-muted-foreground">
                            Bukan cuma manis di lidah, tapi juga manis di laporan keuangan.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="group rounded-3xl border-2 border-border bg-card p-6 shadow-[0_6px_0_-2px_var(--border)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_10px_0_-4px_var(--border)]"
                            >
                                <div
                                    className={`mb-5 inline-flex h-12 w-12 -rotate-3 items-center justify-center rounded-2xl border-2 border-foreground/10 transition group-hover:rotate-0 ${feature.tone}`}
                                >
                                    <feature.icon className="h-6 w-6" />
                                </div>
                                <h3 className="font-display text-xl font-extrabold">
                                    {feature.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed font-medium text-muted-foreground">
                                    {feature.body}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* steps */}
                <section id="cara" className="relative z-10 mx-auto max-w-6xl px-5 pb-20">
                    <div className="rounded-[2.5rem] border-2 border-border bg-card p-6 shadow-[0_8px_0_-3px_var(--border)] sm:p-10">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-[11px] font-extrabold tracking-[0.14em] text-accent-foreground uppercase">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    cara kerja
                                </div>
                                <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                                    Tiga langkah, gabin siap jualan
                                </h2>
                            </div>
                            <p className="max-w-sm text-sm font-medium text-muted-foreground">
                                Nggak perlu jadi ahli akuntansi. Yang penting jujur sama angka dan
                                nggak lupa makan es krim.
                            </p>
                        </div>

                        <div className="mt-9 grid gap-5 md:grid-cols-3">
                            {steps.map((step, index) => (
                                <div
                                    key={step.number}
                                    className={`relative rounded-3xl border-2 border-border p-6 ${
                                        index === 0
                                            ? 'bg-primary/10'
                                            : index === 1
                                              ? 'bg-secondary/40'
                                              : 'bg-accent/30'
                                    }`}
                                >
                                    <div className="font-display text-5xl font-extrabold opacity-15">
                                        {step.number}
                                    </div>
                                    <h3 className="mt-2 font-display text-xl font-extrabold">
                                        {step.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed font-medium text-muted-foreground">
                                        {step.body}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="relative z-10 mx-auto max-w-6xl px-5 pb-20">
                    <div className="relative overflow-hidden rounded-[2.5rem] border-4 border-foreground/10 bg-foreground px-6 py-12 text-background shadow-[0_12px_0_-4px_var(--border)] sm:px-12">
                        <div className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-primary/40 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-accent/30 blur-2xl" />

                        <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                            <div className="max-w-xl">
                                <div className="inline-flex items-center gap-2 rounded-full bg-background/10 px-4 py-1.5 text-[11px] font-extrabold tracking-[0.14em] uppercase">
                                    <Cookie className="h-3.5 w-3.5" />
                                    siap mulai?
                                </div>
                                <h2 className="mt-4 font-display text-3xl leading-tight font-extrabold sm:text-4xl">
                                    Siap bikin buku dapurnya serapi es krim yang belum lumer?
                                </h2>
                                <p className="mt-3 text-sm font-medium text-background/70">
                                    Masuk ke dapur digital gabinbite.pwt. Gratis untuk partner yang
                                    sudah punya niat rapi.
                                </p>
                            </div>

                            <Link
                                href={primaryHref}
                                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-extrabold text-primary-foreground shadow-[0_5px_0_0_rgba(0,0,0,0.3)] transition hover:-translate-y-0.5 hover:opacity-95"
                            >
                                {primaryLabel}
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* footer */}
                <footer className="relative z-10 border-t-2 border-border/70 px-5 py-8">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
                        <div className="flex items-center gap-2">
                            <img
                                src="/logo-gabinbite.svg"
                                alt=""
                                className="h-8 w-8 -rotate-3"
                            />
                            <span className="font-display text-sm font-extrabold">
                                gabinbite<span className="text-primary">.pwt</span>
                            </span>
                        </div>
                        <p className="text-xs font-semibold text-muted-foreground">
                            © {new Date().getFullYear()} gabinbite.pwt, dibuat sambil ngemil. Kalau
                            ada bug, anggap topping. 🍦
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
