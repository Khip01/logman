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
import { useT } from '@/lib/i18n'

/** Nama alasan contoh; pada aplikasi nyata daftar ini berasal dari config. */
const ALASAN = ['Libur Nasional', 'Cuti Bersama', 'Izin', 'Sakit']

/**
 * Galeri komponen untuk agen (AGENTS.md bagian 15). Dipakai untuk memeriksa tampilan
 * lewat screenshot dan memverifikasi perilaku dasar tiap primitif.
 */
export function DevComponentsPage() {
  const t = useT()
  const [switchOn, setSwitchOn] = useState(true)
  const [checked, setChecked] = useState<boolean | 'indeterminate'>('indeterminate')
  const [combobox, setCombobox] = useState('')
  const [selectValue, setSelectValue] = useState('A4')
  const [sliderValue, setSliderValue] = useState([30])
  const [segment, setSegment] = useState<'a' | 'b' | 'c'>('a')

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-1 text-[17px] font-semibold text-text-primary">
        {t('dev.komponen.galeri')}
      </h1>
      <p className="mb-8 text-[13px] text-text-muted">{t('dev.komponen.galeriDeskripsi')}</p>

      <Section title="Button">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary">{t('common.simpan')}</Button>
          <Button variant="outline">{t('common.batal')}</Button>
          <Button variant="ghost">{t('common.lewati')}</Button>
          <Button variant="danger">{t('common.hapus')}</Button>
          <Button variant="outline" disabled>
            {t('common.nonaktif')}
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="primary" size="sm">
            {t('dev.komponen.kecil')}
          </Button>
          <Button variant="outline" size="md">
            {t('dev.komponen.sedang')}
          </Button>
          <Button variant="outline" size="lg">
            {t('dev.komponen.besar')}
          </Button>
          <Button variant="outline" size="icon" aria-label={t('common.tambah')}>
            <Plus />
          </Button>
          <Button variant="primary">
            <Download /> {t('dev.komponen.unduh')}
          </Button>
        </div>
      </Section>

      <Section title="Input dan Field">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            htmlFor="gal-nama"
            label={t('dev.komponen.nama')}
            description={t('dev.komponen.namaDeskripsi')}
            required
          >
            <Input id="gal-nama" placeholder={t('settings.namaLengkap')} />
          </Field>
          <Field htmlFor="gal-nim" label={t('dev.komponen.nim')} error={t('dev.komponen.nimError')}>
            <Input id="gal-nim" placeholder={t('dev.komponen.nimPlaceholder')} />
          </Field>
        </div>
        <Field htmlFor="gal-kegiatan" label={t('dev.komponen.kegiatan')} className="mt-4">
          <Textarea
            id="gal-kegiatan"
            rows={3}
            placeholder={t('dev.komponen.kegiatanPlaceholder')}
          />
        </Field>
      </Section>

      <Section title="Kontrol pilihan">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2 text-[13px] text-text-main">
            <Switch id="gal-switch" checked={switchOn} onCheckedChange={setSwitchOn} />
            <label htmlFor="gal-switch">{t('dev.komponen.simpanOtomatis')}</label>
          </div>

          <div className="flex items-center gap-2 text-[13px] text-text-main">
            <Checkbox id="gal-checkbox" checked={checked} onCheckedChange={setChecked} />
            <label htmlFor="gal-checkbox">{t('dev.komponen.pilihSebagian')}</label>
          </div>

          <div className="flex w-48 items-center gap-3">
            <Slider
              value={sliderValue}
              onValueChange={setSliderValue}
              max={100}
              step={1}
              aria-label={t('dev.komponen.ambang')}
            />
            <span className="text-[12px] text-text-muted">{sliderValue[0]}</span>
          </div>
        </div>

        <div className="mt-4">
          <SegmentedControl
            aria-label={t('dev.komponen.contohSegmented')}
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
          <Field htmlFor="gal-kertas" label={t('settings.ukuranKertas')}>
            <Select value={selectValue} onValueChange={setSelectValue}>
              <SelectTrigger id="gal-kertas" aria-label={t('settings.ukuranKertas')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4</SelectItem>
                <SelectItem value="F4">F4</SelectItem>
                <SelectItem value="Letter">Letter</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field
            htmlFor="gal-alasan"
            label={t('dev.komponen.alasan')}
            description={t('dev.komponen.alasanDeskripsi')}
          >
            <Combobox
              options={ALASAN}
              value={combobox}
              onValueChange={setCombobox}
              placeholder={t('dev.komponen.alasanPlaceholder')}
            />
          </Field>
        </div>
      </Section>

      <Section title="Badge dan Kbd">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{t('dev.komponen.netral')}</Badge>
          <Badge tone="accent">{t('dev.komponen.aksen')}</Badge>
          <Badge tone="ok">{t('common.tersimpan')}</Badge>
          <Badge tone="warn">{t('dev.komponen.menunggu')}</Badge>
          <Badge tone="error">{t('common.gagal')}</Badge>
        </div>
        <p className="mt-3 flex items-center gap-2 text-[13px] text-text-muted">
          {t('dev.komponen.pintasanSebelum')} <Kbd>Ctrl</Kbd> <Kbd>S</Kbd>{' '}
          {t('dev.komponen.pintasanSesudah')}
        </p>
      </Section>

      <Section title="Dialog, Popover, Tooltip">
        <div className="flex flex-wrap items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Info /> {t('dev.komponen.bukaDialog')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('dev.komponen.tambahMinggu')}</DialogTitle>
                <DialogDescription>{t('dev.komponen.dialogDeskripsi')}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">{t('common.batal')}</Button>
                <Button variant="primary">{t('common.tambah')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <SimpleTooltip label={t('dev.komponen.cetakDokumen')}>
            <Button variant="outline" size="icon" aria-label={t('dev.komponen.cetak')}>
              <Printer />
            </Button>
          </SimpleTooltip>

          <SimpleTooltip label={t('dev.komponen.salin')}>
            <Button variant="ghost" size="icon" aria-label={t('dev.komponen.salin')}>
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
            <CardTitle>{t('dev.komponen.ringkasanMinggu')}</CardTitle>
            <CardDescription>{t('dev.komponen.kartuDeskripsi')}</CardDescription>
          </CardHeader>
          <CardContent className="text-[13px] text-text-main">
            {t('dev.komponen.isiKartu')}
          </CardContent>
          <CardFooter>
            <Button variant="primary" size="sm">
              <Save /> {t('common.simpan')}
            </Button>
            <Button variant="ghost" size="sm">
              <Trash2 /> {t('common.hapus')}
            </Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="Separator">
        <Separator />
        <p className="mt-3 text-[12px] text-text-dim">{t('dev.komponen.setelahPemisah')}</p>
      </Section>

      <Section title="Empty State">
        <Card padding="none">
          <EmptyState
            icon={Info}
            title={t('dev.komponen.belumAdaData')}
            description={t('dev.komponen.kosongDeskripsi')}
            action={<Button variant="primary">{t('dev.komponen.mulai')}</Button>}
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
