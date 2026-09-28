/**
 * Every building block on one page, to review how they look and behave (`pnpm dev`, /dev/ui).
 * Development only: not part of the built app, so its text is not translated.
 */
import { CalendarDate, Time } from '@internationalized/date'
import { Leaf, MoreHorizontal, Plus, Settings, Sunrise, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { MenuTrigger } from 'react-aria-components'
import { MethodInfo } from '@/components/MethodInfo'
import { Logo } from '@/components/brand/Logo'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { ComboBox } from '@/components/ui/ComboBox'
import { DatePicker } from '@/components/ui/DatePicker'
import { Form } from '@/components/ui/Form'
import { IconButton } from '@/components/ui/IconButton'
import { Link } from '@/components/ui/Link'
import { ListBoxItem } from '@/components/ui/ListBoxItem'
import { Menu, MenuItem } from '@/components/ui/Menu'
import { Meter } from '@/components/ui/Meter'
import { Dialog, DialogTitle, Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { TextField } from '@/components/ui/TextField'
import { TimeField } from '@/components/ui/TimeField'

export function UiGalleryPage() {
  const [isModalOpen, setModalOpen] = useState(false)
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-8">
      <header className="flex items-center justify-between">
        <Logo />
        <p className="text-sm text-grove-muted">Building blocks · components/ui</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Buttons" subtitle="Button · IconButton" icon={<Leaf />}>
          <Row>
            <Button>Save thought</Button>
            <Button variant="secondary">Let them rest</Button>
            <Button variant="quiet">Cancel</Button>
            <Button variant="danger">Delete</Button>
          </Row>
          <Row>
            <Button size="sm">Plant one</Button>
            <Button size="sm" variant="secondary">
              <Plus className="size-4" aria-hidden /> Add
            </Button>
            <Button isPending>Saving</Button>
            <Button isDisabled>Disabled</Button>
          </Row>
          <Row>
            <IconButton aria-label="Settings">
              <Settings />
            </IconButton>
            <IconButton aria-label="Add" variant="secondary">
              <Plus />
            </IconButton>
            <IconButton aria-label="Delete" variant="danger" size="sm">
              <Trash2 />
            </IconButton>
          </Row>
        </Card>

        <Card title="Messages" subtitle="Alert · Spinner · Link">
          <div className="space-y-3">
            <Alert>Your weekly review is ready when you are.</Alert>
            <Alert tone="success">Saved. Nice and calm.</Alert>
            <Alert tone="error">The server can't be reached. Check your connection.</Alert>
          </div>
          <Row>
            <span className="text-grove-moss">
              <Spinner label="Loading" />
            </span>
            <Link href="/dev/ui">A link inside the app</Link>
          </Row>
        </Card>

        <Card title="Fields" subtitle="TextField · Form" className="md:col-span-2">
          <Form className="grid gap-5 md:grid-cols-2">
            <TextField
              label="Name"
              placeholder="Your first name"
              description="Shown in the greeting."
            />
            <TextField
              label="Email"
              defaultValue="not an email"
              isInvalid
              errorMessage="That doesn't look like an email address."
            />
            <TextField label="Disabled" defaultValue="Read only for now" isDisabled />
            <TextField
              label="A thought"
              placeholder="Whatever is taking up space in your head…"
              multiline
            />
          </Form>
        </Card>

        <Card
          title="Card"
          subtitle="Title, subtitle, icon and actions"
          icon={<Leaf />}
          actions={
            <IconButton aria-label="Card settings" size="sm">
              <Settings />
            </IconButton>
          }
        >
          <p className="text-grove-muted">The surface every homepage card is built on.</p>
        </Card>

        <Card
          title="Choices"
          subtitle="Checkbox · Select · ComboBox · Menu"
          className="md:col-span-2"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3">
              <Checkbox defaultSelected>Deep work on chapter 2</Checkbox>
              <Checkbox>Call the editor</Checkbox>
              <Checkbox isDisabled>Disabled</Checkbox>
            </div>
            <Select label="Language" defaultSelectedKey="en">
              <ListBoxItem id="en">English</ListBoxItem>
              <ListBoxItem id="fr">Français</ListBoxItem>
              <ListBoxItem id="es">Español</ListBoxItem>
            </Select>
            <ComboBox label="Timezone" defaultItems={ZONES}>
              {(zone) => <ListBoxItem id={zone.id}>{zone.id}</ListBoxItem>}
            </ComboBox>
            <Row>
              <MenuTrigger>
                <IconButton aria-label="More" variant="secondary">
                  <MoreHorizontal />
                </IconButton>
                <Menu>
                  <MenuItem id="tomorrow">
                    <Sunrise aria-hidden />
                    Move to tomorrow
                  </MenuItem>
                  <MenuItem id="delete" isDanger>
                    <Trash2 aria-hidden />
                    Delete
                  </MenuItem>
                </Menu>
              </MenuTrigger>
              <Button variant="secondary" onPress={() => setModalOpen(true)}>
                Open a modal
              </Button>
              <MethodInfo method="hoshinKanri" />
            </Row>
          </div>
        </Card>

        <Card
          title="Dates, times, amounts"
          subtitle="DatePicker · TimeField · Meter"
          className="md:col-span-2"
        >
          <div className="grid gap-5 md:grid-cols-3">
            <DatePicker label="Hoped for by" defaultValue={new CalendarDate(2026, 12, 18)} />
            <TimeField label="From" defaultValue={new Time(9, 30)} />
            <Meter label="Time aligned this week" value={62} />
          </div>
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onOpenChange={setModalOpen} className="max-w-md">
        <Dialog>
          <DialogTitle>A calm modal</DialogTitle>
          <p className="mb-5 text-grove-muted">Esc, or a click outside, closes it.</p>
          <Button slot="close">Close</Button>
        </Dialog>
      </Modal>
    </div>
  )
}

const ZONES = ['Europe/Zurich', 'Europe/Paris', 'Europe/Madrid', 'America/New_York'].map((id) => ({
  id,
}))

function Row({ children }: { children: ReactNode }) {
  return <div className="mt-4 flex flex-wrap items-center gap-3 first:mt-0">{children}</div>
}
