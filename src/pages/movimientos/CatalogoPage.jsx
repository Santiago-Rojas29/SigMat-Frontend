import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader }  from '../../components/molecules/PageHeader'
import { DataTable }   from '../../components/organisms/DataTable'
import { Badge }       from '../../components/atoms/Badge'
import { AppSelect }   from '../../components/atoms/AppSelect'
import { useToast }    from '../../hooks/useToast'
import api             from '../../services/api'

const CATEGORIAS = {
  'consumible':    { label: 'Consumible',    variant: 'info'    },
  'no consumible': { label: 'No Consumible', variant: 'success' },
  'perecedero':    { label: 'Perecedero',    variant: 'warning' },
}

function fmtNombre(enc) {
  if (!enc) return '—'
  return `${enc.nombres ?? ''} ${enc.apellidos ?? ''}`.trim() || '—'
}

export function CatalogoPage() {
  const navigate = useNavigate()
  const { showToast, toastPortal } = useToast()

  const [catalogo,        setCatalogo]        = useState([])
  const [loading,         setLoading]         = useState(true)
  const [filtroCategoria, setFiltroCategoria] = useState('')

  useEffect(() => {
    api.get('/material/catalogo')
      .then(({ data }) => setCatalogo(data))
      .catch(() => showToast('error', 'No se pudo cargar el catálogo'))
      .finally(() => setLoading(false))
  }, [])

  // Aplanar: una fila por (material, ubicacion)
  const datosFlat = useMemo(() => {
    const rows = []
    for (const mat of catalogo) {
      if (filtroCategoria && mat.categoria !== filtroCategoria) continue
      for (const ub of mat.ubicaciones) {
        rows.push({
          _key:             `${mat.id_material}__${ub.id_ubicacion}`,
          id_material:      mat.id_material,
          nombre:           mat.nombre,
          categoria:        mat.categoria,
          tipo:             mat.tipo,
          marca:            mat.marca ?? null,
          modelo:           mat.modelo ?? null,
          id_ubicacion:     ub.id_ubicacion,
          ubicacion_nombre: ub.ubicacion_nombre,
          area_nombre:      ub.area_nombre ?? null,
          disponible:       ub.disponible,
          encargado:        ub.encargado ?? null,
        })
      }
    }
    return rows
  }, [catalogo, filtroCategoria])

  const handleSolicitar = (row) => {
    navigate('/movimientos/solicitudes', {
      state: {
        fromCatalog:  true,
        encargado:    row.encargado,
        id_ubicacion: row.id_ubicacion,
        id_material:  row.id_material,
        categoria:    row.categoria,
      },
    })
  }

  const columns = [
    {
      key: 'nombre', header: 'Material',
      render: row => {
        const cat = CATEGORIAS[row.categoria]
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: 13.5, color: '#111827' }}>{row.nombre}</span>
              {cat && <Badge variant={cat.variant}>{cat.label}</Badge>}
            </div>
            <span style={{ fontSize: 11.5, color: '#6b7280' }}>
              {row.tipo}{row.marca ? ` · ${row.marca}` : ''}{row.modelo ? ` ${row.modelo}` : ''}
            </span>
          </div>
        )
      },
    },
    {
      key: 'ubicacion_nombre', header: 'Ubicación',
      render: row => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 13, color: '#111827' }}>{row.ubicacion_nombre}</span>
          {row.area_nombre && (
            <span style={{ fontSize: 11.5, color: '#6b7280' }}>{row.area_nombre}</span>
          )}
        </div>
      ),
    },
    {
      key: 'disponible', header: 'Disponible', width: 110, align: 'center',
      render: row => <Badge variant="success">{row.disponible}</Badge>,
    },
    {
      key: 'encargado', header: 'Encargado',
      render: row => row.encargado
        ? <span style={{ fontSize: 13 }}>{fmtNombre(row.encargado)}</span>
        : <span style={{ fontSize: 12, color: '#d97706' }}>Sin encargado</span>,
    },
    {
      key: '_acciones', header: '', width: 110, searchable: false,
      render: row => row.encargado ? (
        <button
          onClick={() => handleSolicitar(row)}
          style={{
            padding: '6px 14px', borderRadius: 7,
            background: '#2563eb', color: '#fff',
            border: 'none', cursor: 'pointer',
            fontSize: 12.5, fontWeight: 600,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
          onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
        >
          Solicitar
        </button>
      ) : (
        <span style={{ fontSize: 11.5, color: '#9ca3af' }}>Sin encargado</span>
      ),
    },
  ]

  return (
    <>
      {toastPortal}
      <div>
        <PageHeader
          title="Catálogo de Materiales"
          description="Consulta los materiales disponibles por ubicación y solicítalos directamente"
        />
        <DataTable
          columns={columns}
          data={datosFlat}
          rowKey="_key"
          loading={loading}
          onRetry={() => {
            setLoading(true)
            api.get('/material/catalogo')
              .then(({ data }) => setCatalogo(data))
              .catch(() => showToast('error', 'No se pudo cargar el catálogo'))
              .finally(() => setLoading(false))
          }}
          searchable
          searchPlaceholder="Buscar por material, tipo, ubicación, encargado…"
          pageSize={15}
          emptyTitle="Sin materiales disponibles"
          emptyDescription="No hay materiales con stock disponible en el sistema."
          actions={
            <AppSelect
              value={filtroCategoria}
              onChange={e => setFiltroCategoria(e.target.value)}
              style={{ minWidth: 160 }}
            >
              <option value="">Todas las categorías</option>
              <option value="consumible">Consumible</option>
              <option value="no consumible">No Consumible</option>
              <option value="perecedero">Perecedero</option>
            </AppSelect>
          }
        />
      </div>
    </>
  )
}
