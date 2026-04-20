import React, { useEffect, useMemo, useState, memo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Search,
  Building2,
  Globe,
  Hash,
  Server,
  Wifi,
  Phone,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { lookupCNPJ, createClient, updateClient } from '../services/api';

interface Props {
  client?: any;
  groups: any[];
  onClose: () => void;
  onSave: () => void;
}

interface FieldProps {
  label: string;
  icon?: any;
  children: React.ReactNode;
  hint?: string;
}

const EMPTY = {
  name: '',
  cnpj: '',
  phone: '',
  host: '',
  ports: '',
  group_id: '',
  ip_interno: '',
  provedor_internet: '',
};

const onlyNumbers = (v: string) => v.replace(/\D/g, '');

const formatCNPJ = (value: string) => {
  const v = onlyNumbers(value).slice(0, 14);

  return v
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

const formatPhone = (value: string) => {
  const v = onlyNumbers(value).slice(0, 11);

  if (v.length <= 10) {
    return v
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  return v
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
};

const Field = memo(
  ({ label, icon: Icon, children, hint }: FieldProps) => (
    <div className="flex flex-col gap-1.5">
      <label
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest"
        style={{ color: '#cccccc' }}
      >
        {Icon && <Icon size={11} style={{ color: '#ed0c00' }} />}
        {label}
      </label>

      {children}

      {hint && (
        <span className="text-xs" style={{ color: '#aaaaaa' }}>
          {hint}
        </span>
      )}
    </div>
  )
);

const ClientModal: React.FC<Props> = ({
  client,
  groups,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjError, setCnpjError] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', esc);

    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  useEffect(() => {
    if (!client) {
      setForm({ ...EMPTY });
      return;
    }

    setForm({
      ...EMPTY,
      ...client,
      cnpj: formatCNPJ(client.cnpj || ''),
      phone: formatPhone(client.phone || ''),
      ports: Array.isArray(client.ports)
        ? client.ports.join(', ')
        : client.ports || '',
      group_id:
        client.group_id !== null &&
        client.group_id !== undefined
          ? String(client.group_id)
          : '',
    });

    setError('');
    setCnpjError('');
  }, [client]);

  const cleanCNPJ = useMemo(
    () => onlyNumbers(form.cnpj),
    [form.cnpj]
  );

  const updateField = (key: string, value: string) => {
    setForm((old) => ({
      ...old,
      [key]: value,
    }));
  };

  const handleLookupCNPJ = async () => {
    if (cleanCNPJ.length !== 14) {
      setCnpjError('CNPJ inválido');
      return;
    }

    try {
      setCnpjLoading(true);
      setCnpjError('');

      const { data } = await lookupCNPJ(cleanCNPJ);

      setForm((old) => ({
        ...old,
        name:
          data.razao_social ||
          data.nome_fantasia ||
          old.name,
      }));
    } catch (err: any) {
      setCnpjError(
        err?.message || 'Erro ao consultar CNPJ'
      );
    } finally {
      setCnpjLoading(false);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');

      const ports = form.ports
        .split(/[,\s]+/)
        .map(Number)
        .filter(
          (p) =>
            !isNaN(p) &&
            p > 0 &&
            p < 65536
        );

      if (!ports.length) {
        setError(
          'Informe ao menos uma porta válida'
        );
        setSaving(false);
        return;
      }

      const payload = {
        ...form,
        cnpj: cleanCNPJ,
        phone: onlyNumbers(form.phone),
        ports,
        group_id: form.group_id
          ? Number(form.group_id)
          : null,
      };

      if (client?.id) {
        await updateClient(client.id, payload);
      } else {
        await createClient(payload);
      }

      onSave();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        background: 'rgba(0,0,0,.75)',
        backdropFilter: 'blur(5px)',
      }}
      onClick={onClose}
    >
      <div
        className="card w-full animate-in fade-in zoom-in duration-200"
        style={{
          maxWidth: '920px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
          style={{
            background: '#000000',
            borderBottom:
              '1px solid rgba(255,255,255,.06)',
          }}
        >
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">
              {client
                ? 'Editar Cliente'
                : 'Novo Cliente'}
            </h2>

            <p
              className="text-xs mt-1"
              style={{ color: '#cccccc' }}
            >
              Cadastro de monitoramento
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost p-2"
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 flex flex-col gap-5"
        >
          {error && (
            <div
              className="rounded-xl px-4 py-3 flex gap-2 text-sm"
              style={{
                background:
                  'rgba(239,68,68,.08)',
                border:
                  '1px solid rgba(239,68,68,.18)',
                color: '#ed0c00',
              }}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="CNPJ" icon={Hash}>
              <div className="relative">
                <input
                  className="field pr-10"
                  value={form.cnpj}
                  placeholder="00.000.000/0000-00"
                  onChange={(e) => {
                    setCnpjError('');
                    updateField(
                      'cnpj',
                      formatCNPJ(
                        e.target.value
                      )
                    );
                  }}
                />

                <button
                  type="button"
                  onClick={handleLookupCNPJ}
                  disabled={cnpjLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  {cnpjLoading ? (
                    <RefreshCw
                      size={14}
                      className="spin"
                    />
                  ) : (
                    <Search size={14} />
                  )}
                </button>
              </div>

              {cnpjError && (
                <span
                  className="text-xs"
                  style={{
                    color: '#ed0c00',
                  }}
                >
                  {cnpjError}
                </span>
              )}
            </Field>

            <Field
              label="Nome / Razão Social"
              icon={Building2}
            >
              <input
                required
                className="field"
                value={form.name}
                onChange={(e) =>
                  updateField(
                    'name',
                    e.target.value
                  )
                }
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Telefone" icon={Phone}>
              <input
                className="field"
                value={form.phone}
                onChange={(e) =>
                  updateField(
                    'phone',
                    formatPhone(
                      e.target.value
                    )
                  )
                }
              />
            </Field>

            <Field label="Grupo">
              <select
                className="field"
                value={form.group_id}
                onChange={(e) =>
                  updateField(
                    'group_id',
                    e.target.value
                  )
                }
              >
                <option value="">
                  Sem grupo
                </option>

                {groups.map((g) => (
                  <option
                    key={g.id}
                    value={g.id}
                  >
                    {g.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Host / IP"
              icon={Globe}
            >
              <input
                required
                className="field"
                value={form.host}
                onChange={(e) =>
                  updateField(
                    'host',
                    e.target.value
                  )
                }
              />
            </Field>

            <Field
              label="Portas"
              icon={Server}
              hint="Separe por vírgula"
            >
              <input
                required
                className="field"
                value={form.ports}
                onChange={(e) =>
                  updateField(
                    'ports',
                    e.target.value
                  )
                }
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Provedor"
              icon={Wifi}
            >
              <input
                className="field"
                value={
                  form.provedor_internet
                }
                onChange={(e) =>
                  updateField(
                    'provedor_internet',
                    e.target.value
                  )
                }
              />
            </Field>

            <Field label="IP Interno">
              <input
                className="field"
                value={form.ip_interno}
                onChange={(e) =>
                  updateField(
                    'ip_interno',
                    e.target.value
                  )
                }
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving && (
                <RefreshCw
                  size={14}
                  className="spin"
                />
              )}

              {saving
                ? 'Salvando...'
                : client
                ? 'Atualizar'
                : 'Criar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ClientModal;