import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export interface OrderStatus {
    id: number;
    no_faktur?: string;
    total?: number;
    status_pembayaran: 'belum_bayar' | 'sudah_bayar';
    status_penyerahan: 'belum_diberikan' | 'sudah_diberikan';
    tanggal_bayar?: string | null;
    tanggal_diberikan?: string | null;
}

export function PaymentBadge({ status }: { status?: string | null }) {
    if (status === 'sudah_bayar') {
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">Sudah bayar</Badge>;
    }
    return <Badge variant="destructive">Belum bayar</Badge>;
}

export function DeliveryBadge({ status }: { status?: string | null }) {
    if (status === 'sudah_diberikan') {
        return <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300">Sudah diberikan</Badge>;
    }
    return <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400">Belum diberikan</Badge>;
}

export function OrderStatusDialog({ sale, label = 'Ubah Status' }: { sale: OrderStatus; label?: string }) {
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [payment, setPayment] = useState<'belum_bayar' | 'sudah_bayar'>(sale.status_pembayaran ?? 'belum_bayar');
    const [delivery, setDelivery] = useState<'belum_diberikan' | 'sudah_diberikan'>(sale.status_penyerahan ?? 'belum_diberikan');

    function save() {
        setProcessing(true);
        router.patch(`/sales/${sale.id}/status`, {
            status_pembayaran: payment,
            status_penyerahan: delivery,
        }, {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <Dialog open={open} onOpenChange={(value) => {
            setOpen(value);
            if (value) {
                setPayment(sale.status_pembayaran ?? 'belum_bayar');
                setDelivery(sale.status_penyerahan ?? 'belum_diberikan');
            }
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Pencil className="mr-1 h-3 w-3" /> {label}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Ubah Status Pesanan</DialogTitle>
                    <DialogDescription>
                        {sale.no_faktur ? `Faktur ${sale.no_faktur}. ` : ''}
                        Status pembayaran dan penyerahan disimpan terpisah.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="grid gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Status Pembayaran</label>
                        <select
                            value={payment}
                            onChange={e => setPayment(e.target.value as 'belum_bayar' | 'sudah_bayar')}
                            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                        >
                            <option value="belum_bayar">Belum bayar</option>
                            <option value="sudah_bayar">Sudah bayar</option>
                        </select>
                        <p className="text-[11px] text-muted-foreground">
                            Pemasukan kas hanya dihitung saat status berubah menjadi sudah bayar.
                        </p>
                    </div>

                    <div className="grid gap-1">
                        <label className="text-xs font-medium text-muted-foreground">Status Penyerahan</label>
                        <select
                            value={delivery}
                            onChange={e => setDelivery(e.target.value as 'belum_diberikan' | 'sudah_diberikan')}
                            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                        >
                            <option value="belum_diberikan">Belum diberikan</option>
                            <option value="sudah_diberikan">Sudah diberikan</option>
                        </select>
                        <p className="text-[11px] text-muted-foreground">
                            Menandai sudah diberikan akan mengurangi stok produk jadi (sekali saja).
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={processing}>Batal</Button>
                    <Button onClick={save} disabled={processing}>{processing ? 'Menyimpan...' : 'Simpan Status'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
