import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Masuk Dapur" />

            <PasskeyVerify />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email kamu</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="nama@email.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Sandi rahasia</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm font-bold"
                                            tabIndex={5}
                                        >
                                            Lupa sandi?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Ketik sandi dapurmu"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">Ingat aku di perangkat ini</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Masuk Dapur
                            </Button>
                        </div>

                        <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-3.5 text-xs">
                            <p className="font-display text-sm font-extrabold text-foreground">
                                🔑 Akun partner demo
                            </p>
                            <p className="mt-0.5 mb-2 text-[11px] font-medium text-muted-foreground">
                                Ssst... jangan dibagikan ke tukang es krim sebelah.
                            </p>
                            <div className="space-y-1 text-muted-foreground">
                                <div className="flex justify-between gap-2 border-b border-primary/10 pb-1">
                                    <span>Partner A: <strong className="text-foreground">partner.a@sikeju.com</strong></span>
                                    <span>sandi: <code className="font-bold text-foreground">password123</code></span>
                                </div>
                                <div className="flex justify-between gap-2 border-b border-primary/10 pb-1">
                                    <span>Partner B: <strong className="text-foreground">partner.b@sikeju.com</strong></span>
                                    <span>sandi: <code className="font-bold text-foreground">password123</code></span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span>Partner C: <strong className="text-foreground">partner.c@sikeju.com</strong></span>
                                    <span>sandi: <code className="font-bold text-foreground">password123</code></span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Halo, partner gabin!',
    description: 'Masuk dulu. Biar gabin dan buku keuangannya sama-sama rapi.',
};
