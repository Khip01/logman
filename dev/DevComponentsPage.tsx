import { Copy, Download, Info, Plus, Printer, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Combobox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  Field,
  Input,
  Kbd,
  SegmentedControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  SimpleTooltip,
  Slider,
  Spinner,
  Switch,
  Textarea,
} from '@/components/ui'

const ALASAN = ['Libur Nasional', 'Cuti Bersama', 'Izin', 'Sakit']

/**
 * Galeri komponen untuk agen (AGENTS.md bagian 15). Dipakai untuk memeriksa tampilan
 * lewat screenshot dan memverifikasi perilaku dasar tiap primitif.
 */
export function DevComponentsPage() {
  const [switchOn, setSwitchOn] = useState(true)
  const [checked, setChecked] = useState<boolean | 'indeterminate'>('indeterminate')
  const [combobox, setCombobox] = useState('')
  const [selectValue, setSelectValue] = useState('A4')
  const [sliderValue, setSliderValue] = useState([30])
  const [segment, setSegment] = useState<'a' | 'b' | 'c'>('a')

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-1 text-[17px] font-semibold text-text-primary">Galeri Komponen</h1>
      <p className="mb-8 text-[13px] text-text-muted">
        Pratinjau seluruh primitif UI. Halaman ini hanya untuk pengembangan.
      </p>

      <Section title="Button">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary">Simpan</Button>
          <Button variant="outline">Batal</Button>
          <Button variant="ghost">Lewati</Button>
          <Button variant="danger">Hapus</Button>
          <Button variant="outline" disabled>
            Nonaktif
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="primary" size="sm">
            Kecil
          </Button>
          <Button variant="outline" size="md">
            Sedang
          </Button>
          <Button variant="outline" size="lg">
            Besar
          </Button>
          <Button variant="outline" size="icon" aria-label="Tambah">
            <Plus />
          </Button>
          <Button variant="primary">
            <Download /> Unduh
          </Button>
        </div>
      </Section>

      <Section title="Input dan Field">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field htmlFor="gal-nama" label="Nama" description="Sesuai kartu mahasiswa." required>
            <Input id="gal-nama" placeholder="Nama lengkap" />
          </Field>
          <Field htmlFor="gal-nim" label="NIM" error="NIM wajib diisi.">
            <Input id="gal-nim" placeholder="Nomor induk" />
          </Field>
        </div>
        <Field htmlFor="gal-kegiatan" label="Kegiatan" className="mt-4">
          <Textarea id="gal-kegiatan" rows={3} placeholder="Tulis kegiatan harian" />
        </Field>
      </Section>

      <Section title="Kontrol pilihan">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2 text-[13px] text-text-main">
            <Switch id="gal-switch" checked={switchOn} onCheckedChange={setSwitchOn} />
            <label htmlFor="gal-switch">Simpan otomatis</label>
          </div>

          <div className="flex items-center gap-2 text-[13px] text-text-main">
            <Checkbox id="gal-checkbox" checked={checked} onCheckedChange={setChecked} />
            <label htmlFor="gal-checkbox">Pilih sebagian</label>
          </div>

          <div className="flex w-48 items-center gap-3">
            <Slider
              value={sliderValue}
              onValueChange={setSliderValue}
              max={100}
              step={1}
              aria-label="Ambang"
            />
            <span className="text-[12px] text-text-muted">{sliderValue[0]}</span>
          </div>
        </div>

        <div className="mt-4">
          <SegmentedControl
            aria-label="Contoh segmented"
            options={[
              { value: 'a', label: 'A4' },
              { value: 'b', label: 'F4' },
              { value: 'c', label: 'Letter' },
            ]}
            value={segment}
            onValueChange={setSegment}
          />
        </div>
      </Section>

      <Section title="Select dan Combobox">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field htmlFor="gal-kertas" label="Ukuran kertas">
            <Select value={selectValue} onValueChange={setSelectValue}>
              <SelectTrigger id="gal-kertas" aria-label="Ukuran kertas">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4</SelectItem>
                <SelectItem value="F4">F4</SelectItem>
                <SelectItem value="Letter">Letter</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field htmlFor="gal-alasan" label="Alasan" description="Bisa dipilih atau diketik bebas.">
            <Combobox
              options={ALASAN}
              value={combobox}
              onValueChange={setCombobox}
              placeholder="Pilih atau ketik alasan"
            />
          </Field>
        </div>
      </Section>

      <Section title="Badge dan Kbd">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Netral</Badge>
          <Badge tone="accent">Aksen</Badge>
          <Badge tone="ok">Tersimpan</Badge>
          <Badge tone="warn">Menunggu</Badge>
          <Badge tone="error">Gagal</Badge>
        </div>
        <p className="mt-3 flex items-center gap-2 text-[13px] text-text-muted">
          Pintasan <Kbd>Ctrl</Kbd> <Kbd>S</Kbd> untuk menyimpan.
        </p>
      </Section>

      <Section title="Dialog, Popover, Tooltip">
        <div className="flex flex-wrap items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Info /> Buka Dialog
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Minggu</DialogTitle>
                <DialogDescription>
                  Dialog contoh dengan judul, deskripsi, dan aksi di footer.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">Batal</Button>
                <Button variant="primary">Tambah</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <SimpleTooltip label="Cetak dokumen">
            <Button variant="outline" size="icon" aria-label="Cetak">
              <Printer />
            </Button>
          </SimpleTooltip>

          <SimpleTooltip label="Salin">
            <Button variant="ghost" size="icon" aria-label="Salin">
              <Copy />
            </Button>
          </SimpleTooltip>
        </div>
      </Section>

      <Section title="Spinner">
        <div className="flex items-center gap-4">
          <Spinner />
          <Spinner className="text-status-warn" />
        </div>
      </Section>

      <Section title="Card">
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Minggu</CardTitle>
            <CardDescription>Contoh kartu dengan header, isi, dan footer.</CardDescription>
          </CardHeader>
          <CardContent className="text-[13px] text-text-main">
            Isi kartu. Semua sudut tegas, tanpa membulat.
          </CardContent>
          <CardFooter>
            <Button variant="primary" size="sm">
              <Save /> Simpan
            </Button>
            <Button variant="ghost" size="sm">
              <Trash2 /> Hapus
            </Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="Separator">
        <Separator />
        <p className="mt-3 text-[12px] text-text-dim">Teks setelah pemisah.</p>
      </Section>

      <Section title="Empty State">
        <Card padding="none">
          <EmptyState
            icon={Info}
            title="Belum ada data"
            description="Contoh tampilan saat data kosong."
            action={<Button variant="primary">Mulai</Button>}
          />
        </Card>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-9" data-testid={`galeri-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <h2 className="mb-3 border-b border-border-base pb-1.5 text-[12px] font-semibold uppercase tracking-widest text-text-dim">
        {title}
      </h2>
      {children}
    </section>
  )
}
