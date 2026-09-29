import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Form } from '@/components/ui/Form'
import { Dialog, DialogTitle, Modal } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import {
  connectorErrorKey,
  toWebAddress,
  useAddConnector,
  useUpdateConnector,
  type Connector,
  type ConnectorChanges,
} from './connectors'

type ConnectorFormProps = {
  /** The connection to change; a new one is made when absent. */
  connector?: Connector
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

/** Add a feed, or change one: its address, its name, and what the AI should do with it. */
export const ConnectorForm = ({ connector, isOpen, onOpenChange }: ConnectorFormProps) => {
  // HOOKS
  const { t } = useTranslation()

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} className="max-w-xl">
      <Dialog>
        <DialogTitle>{connector ? t('connectors.edit') : t('connectors.add')}</DialogTitle>
        {/* Mounted only while open, so it starts fresh every time. */}
        <ConnectorFields connector={connector} onDone={() => onOpenChange(false)} />
      </Dialog>
    </Modal>
  )
}

type FormValues = { url: string; name: string; instruction: string }

type ConnectorFieldsProps = { connector?: Connector; onDone: () => void }

const ConnectorFields = ({ connector, onDone }: ConnectorFieldsProps) => {
  // RQ
  const add = useAddConnector()
  const update = useUpdateConnector()

  // RHF
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      url: connector?.url ?? '',
      name: connector?.name ?? '',
      instruction: connector?.instruction ?? '',
    },
  })

  // HOOKS
  const { t } = useTranslation()

  // METHODS
  const save = async ({ url, name, instruction }: FormValues) => {
    const address = toWebAddress(url) ?? url
    const fields = { name: name.trim(), instruction: instruction.trim() || null }
    if (!connector) {
      await add.mutateAsync({ url: address, ...fields, name: fields.name || null })
    } else {
      // An address left as it was isn't sent, so the server doesn't check the feed again.
      const changes: ConnectorChanges =
        address === connector.url ? fields : { url: address, ...fields }
      await update.mutateAsync({ id: connector.id, changes })
    }
    onDone()
  }

  // VARS
  const mutation = connector ? update : add

  return (
    <Form onSubmit={handleSubmit((values) => save(values).catch(() => {}))}>
      <Controller
        name="url"
        control={control}
        rules={{ validate: (url) => toWebAddress(url) !== null || t('connectors.form.urlInvalid') }}
        render={({ field, fieldState }) => (
          <TextField
            label={t('connectors.form.url')}
            description={t('connectors.form.urlHelp')}
            placeholder="example.com/feed"
            isRequired
            autoFocus={!connector}
            inputMode="url"
            autoComplete="url"
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            isInvalid={fieldState.invalid}
            errorMessage={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="name"
        control={control}
        rules={{ validate: (name) => !connector || name.trim() !== '' }}
        render={({ field, fieldState }) => (
          <TextField
            label={t('connectors.form.name')}
            description={connector ? undefined : t('connectors.form.nameHelp')}
            isRequired={Boolean(connector)}
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            isInvalid={fieldState.invalid}
          />
        )}
      />
      <Controller
        name="instruction"
        control={control}
        render={({ field }) => (
          <TextField
            label={t('connectors.form.instruction')}
            description={t('connectors.form.instructionHelp')}
            multiline
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            className="[&_textarea]:min-h-24"
          />
        )}
      />
      {mutation.isError && <Alert tone="error">{t(connectorErrorKey(mutation.error))}</Alert>}
      <div className="flex justify-end gap-3">
        <Button variant="quiet" slot="close">
          {t('common.cancel')}
        </Button>
        <Button type="submit" isPending={mutation.isPending}>
          {connector ? t('common.save') : t('connectors.form.add')}
        </Button>
      </div>
    </Form>
  )
}
