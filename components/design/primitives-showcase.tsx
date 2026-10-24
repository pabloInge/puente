'use client'

import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { Icon, icons } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import { DesignSection } from './design-section'

const modalities = [
  { value: 'online', label: 'Online' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'mixta', label: 'Mixta' },
]

export function PrimitivesShowcase() {
  return (
    <>
      <DesignSection title="Botones" description="Altura de 44 px en pantallas táctiles y foco visible de 2 px.">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Solicitar turno</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="outline">
            <Icon icon={icons.Calendar} data-icon="inline-start" />
            Ver agenda
          </Button>
          <Button variant="ghost">Fantasma</Button>
          <Button variant="destructive">Romper vínculo</Button>
          <Button variant="link">Enlace</Button>
          <Button disabled>
            <Spinner data-icon="inline-start" />
            Guardando
          </Button>
          <Tooltip>
            <TooltipTrigger render={<Button variant="outline" size="icon" aria-label="Ayuda" />}>
              <Icon icon={icons.CircleHelp} />
            </TooltipTrigger>
            <TooltipContent>Ayuda contextual</TooltipContent>
          </Tooltip>
        </div>
      </DesignSection>

      <Separator />

      <DesignSection title="Formularios">
        <form className="max-w-md" onSubmit={(event) => event.preventDefault()}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="design-email">Email</FieldLabel>
              <Input id="design-email" type="email" placeholder="nombre@correo.com" />
            </Field>
            <Field data-invalid>
              <FieldLabel htmlFor="design-dni">DNI</FieldLabel>
              <Input id="design-dni" aria-invalid defaultValue="12" />
              <FieldDescription>Ingresá entre 7 y 8 dígitos.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="design-modality">Modalidad</FieldLabel>
              <Select items={modalities} defaultValue="online">
                <SelectTrigger id="design-modality" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {modalities.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="design-reason">Motivo de consulta</FieldLabel>
              <Textarea id="design-reason" placeholder="Contanos brevemente qué te trae" />
            </Field>
            <FieldSet>
              <FieldLegend variant="label">Frecuencia</FieldLegend>
              <RadioGroup defaultValue="semanal">
                <Field orientation="horizontal">
                  <RadioGroupItem value="semanal" id="design-weekly" />
                  <FieldLabel htmlFor="design-weekly">Semanal</FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <RadioGroupItem value="quincenal" id="design-biweekly" />
                  <FieldLabel htmlFor="design-biweekly">Quincenal</FieldLabel>
                </Field>
              </RadioGroup>
            </FieldSet>
            <Field orientation="horizontal">
              <Checkbox id="design-terms" />
              <FieldLabel htmlFor="design-terms">Acepto los términos y la política de privacidad</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <Switch id="design-progress" defaultChecked />
              <FieldLabel htmlFor="design-progress">Ver mi progreso</FieldLabel>
            </Field>
          </FieldGroup>
        </form>
      </DesignSection>

      <Separator />

      <DesignSection title="Contenido">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-4">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback>LM</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <CardTitle>Lic. Laura Méndez</CardTitle>
                  <CardDescription>Psicología clínica · Online</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge>Atiende por PAMI</Badge>
              <Badge variant="secondary">TCC</Badge>
              <Badge variant="outline">Matrícula no verificada</Badge>
            </CardContent>
            <CardFooter className="gap-2">
              <Button className="flex-1">Ver perfil</Button>
              <Button variant="outline" onClick={() => toast.success('Turno solicitado')}>
                Probar aviso
              </Button>
            </CardFooter>
          </Card>

          <div className="flex flex-col gap-4">
            <Alert>
              <Icon icon={icons.Info} />
              <AlertTitle>Orientación, no diagnóstico</AlertTitle>
              <AlertDescription>Las recomendaciones te ayudan a elegir, pero no reemplazan una consulta.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <Icon icon={icons.CircleAlert} />
              <AlertTitle>Ya tenés un vínculo abierto</AlertTitle>
              <AlertDescription>Finalizalo antes de solicitar uno nuevo.</AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2 rounded-lg border bg-surface-1 p-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </DesignSection>

      <Separator />

      <DesignSection title="Navegación y superposiciones">
        <div className="flex flex-col gap-6">
          <Tabs defaultValue="semana">
            <TabsList>
              <TabsTrigger value="dia">Día</TabsTrigger>
              <TabsTrigger value="semana">Semana</TabsTrigger>
            </TabsList>
            <TabsContent value="dia" className="pt-3 text-sm text-muted-foreground">
              Vista de día.
            </TabsContent>
            <TabsContent value="semana" className="pt-3 text-sm text-muted-foreground">
              Vista de semana.
            </TabsContent>
          </Tabs>

          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger render={<Button variant="outline" />}>Abrir diálogo</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancelar turno</DialogTitle>
                  <DialogDescription>Si cancelás con menos de 24 h, se registra como cancelación tardía.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>Volver</DialogClose>
                  <Button variant="destructive">Cancelar turno</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Sheet>
              <SheetTrigger render={<Button variant="outline" />}>Abrir panel</SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Detalle del turno</SheetTitle>
                  <SheetDescription>En mobile se usa como hoja; en desktop, como panel lateral.</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
          </div>

          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Icon icon={icons.CalendarX} />
              </EmptyMedia>
              <EmptyTitle>No tenés turnos próximos</EmptyTitle>
              <EmptyDescription>Cuando solicites un turno, lo vas a ver acá.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </DesignSection>
    </>
  )
}
