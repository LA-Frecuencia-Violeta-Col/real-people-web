import React, { useState, useMemo } from 'react';
import { PageData } from '../types';
import {
  Save, X, Image as ImageIcon, Type, DollarSign, List, Clock, Plus, Trash2,
  MessageCircle, ChevronUp, ChevronDown, LogOut, Eye, EyeOff,
  Instagram, Youtube, Music2, Music,
  LayoutGrid, Monitor, Sparkles, Mic2, Zap, Building2, Plane,
  Ticket, ShoppingCart, HelpCircle, Globe, Settings, CheckCircle2,
  AlertCircle, Loader2, Menu, Search,
} from 'lucide-react';
import { uploadFile } from '../services/storageService';

interface AdminPanelProps {
  data: PageData;
  onSave: (newData: PageData) => Promise<void>;
  onClose: () => void;
  onLogout: () => void;
}

// ─── Tab groups config (with icons) ───────────────────────────────────────────

const tabGroups = [
  { label: 'General',      tabs: [{ id: 'structure',   label: 'Estructura',   Icon: LayoutGrid  }] },
  { label: 'Portada',      tabs: [{ id: 'hero',        label: 'Hero',         Icon: Monitor     }, { id: 'welcome',    label: 'Bienvenida',   Icon: Sparkles   }] },
  { label: 'Programa',     tabs: [{ id: 'lineup',      label: 'Line Up',      Icon: Mic2        }, { id: 'experience', label: 'Experiencia',  Icon: Zap        }] },
  { label: 'Alojamiento',  tabs: [{ id: 'lodging',     label: 'Hospedaje',    Icon: Building2   }, { id: 'caliPackage',label: 'Paquete Cali', Icon: Plane      }] },
  { label: 'Ventas',       tabs: [{ id: 'tickets',     label: 'Boletería',    Icon: Ticket      }, { id: 'buy',        label: 'Comprar',      Icon: ShoppingCart }] },
  { label: 'Información',  tabs: [{ id: 'faqs',        label: 'Preguntas',    Icon: HelpCircle  }, { id: 'footer',     label: 'Footer',       Icon: Globe      }] },
  { label: 'Ajustes',      tabs: [{ id: 'seo',         label: 'SEO / Social', Icon: Search      }, { id: 'settings',   label: 'Configuración', Icon: Settings   }] },
];

const allTabs = tabGroups.flatMap(g => g.tabs);

// ─── AdminPanel ────────────────────────────────────────────────────────────────

export const AdminPanel: React.FC<AdminPanelProps> = ({ data, onSave, onClose, onLogout }) => {
  const [formData, setFormData] = useState<PageData>(data);
  const [activeTab, setActiveTab] = useState('hero');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [welcomeBlock, setWelcomeBlock] = useState<1 | 2>(1);

  // Detect unsaved changes
  const hasChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(data),
    [formData, data]
  );

  const accent = formData.settings.accentColor || '#D4AF37';
  const currentTabLabel = allTabs.find(t => t.id === activeTab)?.label ?? '';

  // Prevent body scroll when panel is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ─── Data handlers ──────────────────────────────────────────────────────────

  const handleChange = (section: keyof PageData, field: string, value: any) => {
    setFormData(prev => ({ ...prev, [section]: { ...(prev[section] as any), [field]: value } }));
  };

  const getArrayKey = (sectionData: any) =>
    sectionData.items ? 'items'
      : sectionData.tiers ? 'tiers'
      : sectionData.suites ? 'suites'
      : sectionData.artists ? 'artists'
      : 'accordion';

  const handleNestedChange = (section: keyof PageData, index: number, field: string, value: any) => {
    const sectionData = { ...(formData[section] as any) };
    const key = getArrayKey(sectionData);
    const items = [...(sectionData[key] || [])];
    items[index] = { ...items[index], [field]: value };
    setFormData(prev => ({ ...prev, [section]: { ...sectionData, [key]: items } }));
  };

  const addItem = (section: keyof PageData, newItem: any, arrayKey?: string) => {
    const sectionData = { ...(formData[section] as any) };
    const key = arrayKey || getArrayKey(sectionData);
    setFormData(prev => ({ ...prev, [section]: { ...sectionData, [key]: [...(sectionData[key] || []), newItem] } }));
  };

  const removeItem = (section: keyof PageData, index: number) => {
    const sectionData = { ...(formData[section] as any) };
    const key = getArrayKey(sectionData);
    setFormData(prev => ({ ...prev, [section]: { ...sectionData, [key]: (sectionData[key] || []).filter((_: any, i: number) => i !== index) } }));
  };

  const moveItem = (section: keyof PageData, index: number, direction: 'up' | 'down') => {
    const sectionData = { ...(formData[section] as any) };
    const key = getArrayKey(sectionData);
    const items = [...(sectionData[key] || [])];
    if (direction === 'up' && index > 0) [items[index], items[index - 1]] = [items[index - 1], items[index]];
    else if (direction === 'down' && index < items.length - 1) [items[index], items[index + 1]] = [items[index + 1], items[index]];
    setFormData(prev => ({ ...prev, [section]: { ...sectionData, [key]: items } }));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...formData.sectionOrder];
    if (direction === 'up' && index > 0) [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    else if (direction === 'down' && index < newOrder.length - 1) [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setFormData(prev => ({ ...prev, sectionOrder: newOrder }));
  };

  const toggleSectionVisibility = (sectionId: string) => {
    setFormData(prev => {
      const isHidden = prev.hiddenSections?.includes(sectionId);
      const newHidden = isHidden ? prev.hiddenSections.filter(id => id !== sectionId) : [...(prev.hiddenSections || []), sectionId];
      return { ...prev, hiddenSections: newHidden };
    });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'seoImage' | 'fontDisplayUrl' | 'fontSansUrl' | 'headerLogoUrl' | 'footerLogoUrl' | 'faviconUrl' | 'adminLogoUrl' | 'globalBgImage' | 'globalBgImageMobile' | 'globalBgImageDesktop'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(field);
      const { url: publicUrl } = await uploadFile(file, 'branding');
      if (field === 'seoImage') handleChange('seo', 'image', publicUrl);
      else handleChange('settings', field, publicUrl);
    } catch (error: any) {
      alert(`Error al subir el archivo: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsUploading(null);
      e.target.value = '';
    }
  };

  // ─── Save & Close ────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (saveState === 'saving') return;
    setSaveState('saving');
    try {
      await onSave(formData);
      setSaveState('saved');
      setTimeout(() => { setSaveState('idle'); onClose(); }, 1500);
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 4000);
    }
  };

  const handleClose = () => {
    if (hasChanges && saveState !== 'saved') {
      if (!window.confirm('Tienes cambios sin guardar. ¿Cerrar de todas formas?')) return;
    }
    onClose();
  };

  const selectTab = (id: string) => { setActiveTab(id); setIsSidebarOpen(false); };

  // ─── Shared: Save Button UI ──────────────────────────────────────────────────

  const renderSaveBtn = (className = '') => (
    <button
      onClick={handleSave}
      disabled={saveState === 'saving'}
      style={saveState === 'idle' ? { backgroundColor: accent } : undefined}
      className={`relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[11px] font-black tracking-wider text-white transition-all duration-300 disabled:opacity-70 ${
        saveState === 'saved'  ? 'bg-emerald-600' :
        saveState === 'error'  ? 'bg-red-600' : ''
      } ${className}`}
    >
      {saveState === 'saving' && <Loader2 size={14} className="animate-spin" />}
      {saveState === 'saved'  && <CheckCircle2 size={14} />}
      {saveState === 'error'  && <AlertCircle size={14} />}
      {saveState === 'idle'   && <Save size={14} />}
      <span>
        {saveState === 'saving' ? 'GUARDANDO...'     :
         saveState === 'saved'  ? '¡GUARDADO!'       :
         saveState === 'error'  ? 'ERROR AL GUARDAR' :
         hasChanges             ? '● GUARDAR CAMBIOS' : 'GUARDAR CAMBIOS'}
      </span>
    </button>
  );

  // ─── Shared: Sidebar Nav ─────────────────────────────────────────────────────

  const renderSidebarNav = () => (
    <nav className="flex-1 overflow-y-auto py-2 space-y-0.5">
      {tabGroups.map(group => (
        <div key={group.label}>
          <div className="px-4 py-2.5 text-[9px] font-black tracking-[0.3em] uppercase text-white/20 select-none">
            {group.label}
          </div>
          {group.tabs.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => selectTab(id)}
                style={isActive ? { backgroundColor: accent + '22', borderColor: accent + '44', color: accent } : {}}
                className={`w-full mx-0 flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all duration-200 border ${
                  isActive ? 'border shadow-sm' : 'border-transparent text-white/40 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={15} className="shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );

  // ─── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-[#080808] flex z-[100] overflow-hidden font-sans">

      {/* ═══ DESKTOP SIDEBAR ═════════════════════════════════════════════════ */}
      <aside className="hidden md:flex w-60 flex-col border-r border-white/8 shrink-0 bg-black/60">
        {/* Branding */}
        <div className="p-5 border-b border-white/5 shrink-0">
          {formData.settings.adminLogoUrl ? (
            <img src={formData.settings.adminLogoUrl} alt="Logo" className="h-8 w-auto" />
          ) : (
            <div>
              <h2 className="text-xs font-black tracking-[0.3em] uppercase" style={{ color: accent }}>Admin Panel</h2>
              <p className="text-[9px] text-white/20 tracking-[0.2em] uppercase font-bold mt-0.5">
                {formData.settings.siteName || 'Real People'}
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-hidden flex flex-col px-2 py-1">
          {renderSidebarNav()}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/5 space-y-2 shrink-0">
          {renderSaveBtn('w-full')}
          <button
            onClick={handleClose}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-white/40 hover:text-white hover:bg-white/5 text-[11px] font-black tracking-wider transition-all"
          >
            <X size={13} /><span>CERRAR</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-red-500/40 hover:text-red-400 text-[10px] font-black tracking-widest transition-all"
          >
            <LogOut size={12} /><span>CERRAR SESIÓN</span>
          </button>
        </div>
      </aside>

      {/* ═══ MOBILE DRAWER ═══════════════════════════════════════════════════ */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-[120]" onClick={() => setIsSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-[#0c0c0c] border-r border-white/10 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div>
                <h2 className="text-xs font-black tracking-[0.3em] uppercase" style={{ color: accent }}>Admin Panel</h2>
                <p className="text-[9px] text-white/20 tracking-[0.2em] uppercase font-bold mt-0.5">
                  {formData.settings.siteName || 'Real People'}
                </p>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col px-2 py-1">
              {renderSidebarNav()}
            </div>
            <div className="p-4 border-t border-white/5 space-y-2">
              {renderSaveBtn('w-full')}
              <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2 text-red-500/40 hover:text-red-400 text-[10px] font-black tracking-widest transition-all">
                <LogOut size={12} /><span>CERRAR SESIÓN</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CONTENT AREA ════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top header */}
        <header className="md:hidden flex items-center justify-between px-3 py-3 border-b border-white/10 bg-black/80 backdrop-blur-sm shrink-0 gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all shrink-0">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />
            <span className="text-xs font-black tracking-[0.2em] uppercase text-white/70 truncate">{currentTabLabel}</span>
          </div>
          <button onClick={handleClose} className="p-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all shrink-0">
            <X size={20} />
          </button>
        </header>

        {/* Desktop content header */}
        <div className="hidden md:flex items-center justify-between px-8 py-5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full" style={{ backgroundColor: accent }} />
            <h2 className="text-xl font-black italic tracking-tight text-white/90 uppercase">{currentTabLabel}</h2>
          </div>
          {hasChanges && saveState === 'idle' && (
            <div className="flex items-center gap-2 text-amber-400 text-[10px] font-black tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              CAMBIOS SIN GUARDAR
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-28 md:pb-8">
          <div className="max-w-3xl mx-auto space-y-5">

            {/* ╔══ ESTRUCTURA ══════════════════════════════════════════════╗ */}
            {activeTab === 'structure' && (
              <div className="space-y-3">
                <p className="text-xs text-white/30 mb-4 leading-relaxed">Usa ↑↓ para reordenar las secciones. El ojo las muestra u oculta en el menú y en la página.</p>
                {formData.sectionOrder.map((id, idx) => (
                  <div key={id} className="flex items-center gap-3 p-4 bg-white/4 rounded-xl border border-white/8">
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button onClick={() => moveSection(idx, 'up')} disabled={idx === 0} className="p-1.5 hover:bg-white/10 rounded transition-colors disabled:opacity-20"><ChevronUp size={13} /></button>
                      <button onClick={() => moveSection(idx, 'down')} disabled={idx === formData.sectionOrder.length - 1} className="p-1.5 hover:bg-white/10 rounded transition-colors disabled:opacity-20"><ChevronDown size={13} /></button>
                    </div>
                    <button
                      onClick={() => toggleSectionVisibility(id)}
                      className={`p-2 rounded-lg transition-all shrink-0 ${formData.hiddenSections?.includes(id) ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}
                    >
                      {formData.hiddenSections?.includes(id) ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[9px] text-white/20 font-black tracking-widest uppercase">ID interno</span>
                        <p className="text-xs text-white/30 font-mono mt-0.5 truncate">{id}</p>
                      </div>
                      <RPInput
                        label="Nombre en Menú"
                        value={formData.sectionLabels[id] || id}
                        onChange={v => setFormData(prev => ({ ...prev, sectionLabels: { ...prev.sectionLabels, [id]: v } }))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ╔══ HERO ════════════════════════════════════════════════════╗ */}
            {activeTab === 'hero' && (
              <div className="space-y-5">
                <RPInput label="Título Principal" value={formData.hero.title} onChange={v => handleChange('hero', 'title', v)} placeholder="Ej: EL RITMO DE LA SELVA" />
                <RPInput label="Subtítulo" value={formData.hero.subtitle} onChange={v => handleChange('hero', 'subtitle', v)} placeholder="Santa Marta 2026 | Una experiencia..." />
                <RPInput label="Fecha del Evento" value={formData.hero.date} onChange={v => handleChange('hero', 'date', v)} type="datetime-local" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RPInput label="Texto Botón CTA" value={formData.hero.ctaText} onChange={v => handleChange('hero', 'ctaText', v)} placeholder="COMPRAR ENTRADAS" />
                  <RPInput label="URL del Botón (ej: #buy)" value={formData.hero.ctaUrl} onChange={v => handleChange('hero', 'ctaUrl', v)} placeholder="#buy o https://..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RPInput label="Imagen de Fondo (URL)" value={formData.hero.bgImage} onChange={v => handleChange('hero', 'bgImage', v)} icon={<ImageIcon size={15} />} placeholder="https://..." />
                  <RPInput label="Video de Fondo (URL MP4 / YouTube)" value={formData.hero.videoUrl} onChange={v => handleChange('hero', 'videoUrl', v)} icon={<List size={15} />} placeholder="https://..." />
                </div>
              </div>
            )}

            {/* ╔══ BIENVENIDA ══════════════════════════════════════════════╗ */}
            {activeTab === 'welcome' && (
              <div className="space-y-6">
                {/* Sub-tab switcher */}
                <div className="flex rounded-xl overflow-hidden border border-white/10 shrink-0">
                  {([1, 2] as const).map(block => (
                    <button
                      key={block}
                      onClick={() => setWelcomeBlock(block)}
                      style={welcomeBlock === block ? { backgroundColor: accent + '22', color: accent, borderColor: accent + '44' } : {}}
                      className={`flex-1 py-3 text-[11px] font-black tracking-widest uppercase transition-all border ${welcomeBlock === block ? 'border' : 'border-transparent text-white/30 hover:text-white/60'}`}
                    >
                      Bloque {block} — {block === 1 ? 'Esencia' : 'Historia'}
                    </button>
                  ))}
                </div>

                {welcomeBlock === 1 && (
                  <div className="space-y-5">
                    <RPInput label="Etiqueta Superior (ej: ESENCIA)" value={(formData.welcome as any).subtitle1 || ''} onChange={v => handleChange('welcome', 'subtitle1', v)} />
                    <RPInput label="Título" value={formData.welcome.title1} onChange={v => handleChange('welcome', 'title1', v)} />
                    <RPTextArea label="Descripción" value={formData.welcome.desc1} onChange={v => handleChange('welcome', 'desc1', v)} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <RPInput label="Imagen (URL)" value={formData.welcome.img1} onChange={v => handleChange('welcome', 'img1', v)} icon={<ImageIcon size={15} />} />
                      <RPInput label="Video (URL MP4 / YouTube)" value={formData.welcome.video1 || ''} onChange={v => handleChange('welcome', 'video1', v)} icon={<List size={15} />} />
                    </div>
                    {/* Accordion */}
                    <div className="space-y-3 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold tracking-widest uppercase text-white/40">Acordeón</span>
                        <button onClick={() => addItem('welcome', { title: '', content: '', hidden: false })} className="flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase transition-opacity hover:opacity-70" style={{ color: accent }}><Plus size={13} /><span>Agregar</span></button>
                      </div>
                      {(formData.welcome.accordion || []).map((item, idx) => (
                        <RPItemCard key={idx} label={item.title || `Item ${idx + 1}`} hidden={!!item.hidden}
                          onToggleHide={() => { const a = [...formData.welcome.accordion]; a[idx] = { ...a[idx], hidden: !item.hidden }; handleChange('welcome', 'accordion', a); }}
                          onMoveUp={() => moveItem('welcome', idx, 'up')} onMoveDown={() => moveItem('welcome', idx, 'down')}
                          onRemove={() => removeItem('welcome', idx)} isFirst={idx === 0} isLast={idx === formData.welcome.accordion.length - 1} compact
                        >
                          <RPInput label="Título" value={item.title} onChange={v => { const a = [...formData.welcome.accordion]; a[idx] = { ...a[idx], title: v }; handleChange('welcome', 'accordion', a); }} />
                          <RPTextArea label="Contenido" value={item.content} onChange={v => { const a = [...formData.welcome.accordion]; a[idx] = { ...a[idx], content: v }; handleChange('welcome', 'accordion', a); }} rows={3} />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <RPInput label="Texto Botón" value={item.btnText || ''} onChange={v => { const a = [...formData.welcome.accordion]; a[idx] = { ...a[idx], btnText: v }; handleChange('welcome', 'accordion', a); }} placeholder="Ej: SABER MÁS" />
                            <RPInput label="URL Botón" value={item.btnUrl || ''} onChange={v => { const a = [...formData.welcome.accordion]; a[idx] = { ...a[idx], btnUrl: v }; handleChange('welcome', 'accordion', a); }} placeholder="#buy o https://..." />
                          </div>
                        </RPItemCard>
                      ))}
                    </div>
                  </div>
                )}

                {welcomeBlock === 2 && (
                  <div className="space-y-5">
                    <RPInput label="Etiqueta Superior (ej: HISTORIA)" value={formData.welcome.subtitle2 || ''} onChange={v => handleChange('welcome', 'subtitle2', v)} />
                    <RPInput label="Título" value={formData.welcome.title2} onChange={v => handleChange('welcome', 'title2', v)} />
                    <RPTextArea label="Descripción" value={formData.welcome.desc2} onChange={v => handleChange('welcome', 'desc2', v)} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <RPInput label="Imagen (URL)" value={formData.welcome.img2} onChange={v => handleChange('welcome', 'img2', v)} icon={<ImageIcon size={15} />} />
                      <RPInput label="Video (URL MP4 / YouTube)" value={formData.welcome.video2 || ''} onChange={v => handleChange('welcome', 'video2', v)} icon={<List size={15} />} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <RPInput label="Texto Botón" value={formData.welcome.btnText2} onChange={v => handleChange('welcome', 'btnText2', v)} />
                      <RPInput label="URL Botón" value={formData.welcome.btnUrl2 || ''} onChange={v => handleChange('welcome', 'btnUrl2', v)} placeholder="#buy o https://..." />
                    </div>
                    {/* Accordion 2 */}
                    <div className="space-y-3 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold tracking-widest uppercase text-white/40">Acordeón (opcional)</span>
                        <button onClick={() => addItem('welcome', { title: '', content: '', hidden: false }, 'accordion2')} className="flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase transition-opacity hover:opacity-70" style={{ color: accent }}><Plus size={13} /><span>Agregar</span></button>
                      </div>
                      {(formData.welcome.accordion2 || []).map((item, idx) => {
                        const acc2 = formData.welcome.accordion2 || [];
                        return (
                          <RPItemCard key={idx} label={item.title || `Item ${idx + 1}`} hidden={!!item.hidden}
                            onToggleHide={() => { const a = [...acc2]; a[idx] = { ...a[idx], hidden: !item.hidden }; handleChange('welcome', 'accordion2', a); }}
                            onMoveUp={() => { const a = [...acc2]; if (idx > 0) { [a[idx], a[idx-1]] = [a[idx-1], a[idx]]; handleChange('welcome', 'accordion2', a); } }}
                            onMoveDown={() => { const a = [...acc2]; if (idx < a.length-1) { [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; handleChange('welcome', 'accordion2', a); } }}
                            onRemove={() => handleChange('welcome', 'accordion2', acc2.filter((_, i) => i !== idx))}
                            isFirst={idx === 0} isLast={idx === acc2.length - 1} compact
                          >
                            <RPInput label="Título" value={item.title} onChange={v => { const a = [...acc2]; a[idx] = { ...a[idx], title: v }; handleChange('welcome', 'accordion2', a); }} />
                            <RPTextArea label="Contenido" value={item.content} onChange={v => { const a = [...acc2]; a[idx] = { ...a[idx], content: v }; handleChange('welcome', 'accordion2', a); }} rows={3} />
                          </RPItemCard>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ╔══ LINE UP ═════════════════════════════════════════════════╗ */}
            {activeTab === 'lineup' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RPInput label="Título" value={formData.lineup.title} onChange={v => handleChange('lineup', 'title', v)} />
                  <RPInput label="Subtítulo" value={formData.lineup.subtitle} onChange={v => handleChange('lineup', 'subtitle', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-widest uppercase text-white/40">Artistas ({formData.lineup.artists?.length || 0})</span>
                  <button onClick={() => addItem('lineup', { name: '', genre: '', time: '', img: '', bio: '', hidden: false })} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black tracking-wider uppercase border transition-all hover:opacity-80" style={{ borderColor: accent + '40', color: accent }}><Plus size={13} /><span>Agregar Artista</span></button>
                </div>
                {(formData.lineup.artists || []).map((artist, idx) => (
                  <RPItemCard key={idx} label={artist.name || `Artista ${idx + 1}`} hidden={!!artist.hidden}
                    onToggleHide={() => { const a = [...formData.lineup.artists]; a[idx] = { ...a[idx], hidden: !artist.hidden }; handleChange('lineup', 'artists', a); }}
                    onMoveUp={() => moveItem('lineup', idx, 'up')} onMoveDown={() => moveItem('lineup', idx, 'down')}
                    onRemove={() => removeItem('lineup', idx)} isFirst={idx === 0} isLast={idx === formData.lineup.artists.length - 1}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <RPInput label="Nombre" value={artist.name} onChange={v => { const a = [...formData.lineup.artists]; a[idx] = { ...a[idx], name: v }; handleChange('lineup', 'artists', a); }} />
                      <RPInput label="Género" value={artist.genre} onChange={v => { const a = [...formData.lineup.artists]; a[idx] = { ...a[idx], genre: v }; handleChange('lineup', 'artists', a); }} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <RPInput label="Horario" value={artist.time} onChange={v => { const a = [...formData.lineup.artists]; a[idx] = { ...a[idx], time: v }; handleChange('lineup', 'artists', a); }} icon={<Clock size={14} />} placeholder="22:00 - 00:00" />
                      <RPInput label="Imagen (URL)" value={artist.img} onChange={v => { const a = [...formData.lineup.artists]; a[idx] = { ...a[idx], img: v }; handleChange('lineup', 'artists', a); }} icon={<ImageIcon size={14} />} />
                    </div>
                    <RPTextArea label="Biografía" value={artist.bio || ''} onChange={v => { const a = [...formData.lineup.artists]; a[idx] = { ...a[idx], bio: v }; handleChange('lineup', 'artists', a); }} rows={3} />
                    <RPInput label="Video YouTube (URL)" value={artist.videoUrl || ''} onChange={v => { const a = [...formData.lineup.artists]; a[idx] = { ...a[idx], videoUrl: v }; handleChange('lineup', 'artists', a); }} icon={<Youtube size={14} />} />
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      <RPInput label="Instagram" value={artist.instagram || ''} onChange={v => { const a = [...formData.lineup.artists]; a[idx] = { ...a[idx], instagram: v }; handleChange('lineup', 'artists', a); }} icon={<Instagram size={13} />} />
                      <RPInput label="Spotify" value={artist.spotify || ''} onChange={v => { const a = [...formData.lineup.artists]; a[idx] = { ...a[idx], spotify: v }; handleChange('lineup', 'artists', a); }} icon={<Music2 size={13} />} />
                      <RPInput label="SoundCloud" value={artist.soundcloud || ''} onChange={v => { const a = [...formData.lineup.artists]; a[idx] = { ...a[idx], soundcloud: v }; handleChange('lineup', 'artists', a); }} icon={<Music size={13} />} />
                      <RPInput label="YouTube Canal" value={artist.youtube || ''} onChange={v => { const a = [...formData.lineup.artists]; a[idx] = { ...a[idx], youtube: v }; handleChange('lineup', 'artists', a); }} icon={<Youtube size={13} />} />
                      <RPInput label="Beatport" value={artist.beatport || ''} onChange={v => { const a = [...formData.lineup.artists]; a[idx] = { ...a[idx], beatport: v }; handleChange('lineup', 'artists', a); }} icon={<Music2 size={13} />} />
                    </div>
                  </RPItemCard>
                ))}
              </div>
            )}

            {/* ╔══ EXPERIENCIA ═════════════════════════════════════════════╗ */}
            {activeTab === 'experience' && (
              <div className="space-y-6">
                <RPInput label="Título de la Sección" value={formData.experience.title} onChange={v => handleChange('experience', 'title', v)} />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-widest uppercase text-white/40">Experiencias ({formData.experience.items?.length || 0})</span>
                  <button onClick={() => addItem('experience', { title: '', desc: '', img: '', duration: '', hidden: false })} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black tracking-wider uppercase border transition-all hover:opacity-80" style={{ borderColor: accent + '40', color: accent }}><Plus size={13} /><span>Agregar</span></button>
                </div>
                {(formData.experience.items || []).map((item, idx) => (
                  <RPItemCard key={idx} label={item.title || `Experiencia ${idx + 1}`} hidden={!!item.hidden}
                    onToggleHide={() => handleNestedChange('experience', idx, 'hidden', !item.hidden)}
                    onMoveUp={() => moveItem('experience', idx, 'up')} onMoveDown={() => moveItem('experience', idx, 'down')}
                    onRemove={() => removeItem('experience', idx)} isFirst={idx === 0} isLast={idx === formData.experience.items.length - 1} compact
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <RPInput label="Título" value={item.title} onChange={v => handleNestedChange('experience', idx, 'title', v)} />
                      <RPInput label="Duración" value={item.duration || ''} onChange={v => handleNestedChange('experience', idx, 'duration', v)} icon={<Clock size={14} />} placeholder="Ej: 2 horas" />
                    </div>
                    <RPTextArea label="Descripción" value={item.desc} onChange={v => handleNestedChange('experience', idx, 'desc', v)} rows={3} />
                    <RPInput label="Imagen (URL)" value={item.img} onChange={v => handleNestedChange('experience', idx, 'img', v)} icon={<ImageIcon size={14} />} />
                  </RPItemCard>
                ))}
              </div>
            )}

            {/* ╔══ HOSPEDAJE ═══════════════════════════════════════════════╗ */}
            {activeTab === 'lodging' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RPInput label="Título" value={formData.lodging.title} onChange={v => handleChange('lodging', 'title', v)} />
                  <RPInput label="Etiqueta Superior" value={formData.lodging.subtitle} onChange={v => handleChange('lodging', 'subtitle', v)} />
                </div>
                <RPTextArea label="Descripción" value={formData.lodging.desc} onChange={v => handleChange('lodging', 'desc', v)} />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-widest uppercase text-white/40">Suites ({formData.lodging.suites?.length || 0})</span>
                  <button onClick={() => addItem('lodging', { name: '', capacity: '', beds: '', space: '', highlight: '', img: '', gallery: [], btnText: '', btnUrl: '', hidden: false })} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black tracking-wider uppercase border transition-all hover:opacity-80" style={{ borderColor: accent + '40', color: accent }}><Plus size={13} /><span>Agregar Suite</span></button>
                </div>
                {(formData.lodging.suites || []).map((suite, idx) => (
                  <RPItemCard key={idx} label={suite.name || `Suite ${idx + 1}`} hidden={!!suite.hidden}
                    onToggleHide={() => { const s = [...formData.lodging.suites]; s[idx] = { ...s[idx], hidden: !suite.hidden }; handleChange('lodging', 'suites', s); }}
                    onMoveUp={() => moveItem('lodging', idx, 'up')} onMoveDown={() => moveItem('lodging', idx, 'down')}
                    onRemove={() => removeItem('lodging', idx)} isFirst={idx === 0} isLast={idx === formData.lodging.suites.length - 1}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <RPInput label="Nombre" value={suite.name} onChange={v => { const s = [...formData.lodging.suites]; s[idx] = { ...s[idx], name: v }; handleChange('lodging', 'suites', s); }} />
                      <RPInput label="Destacado" value={suite.highlight} onChange={v => { const s = [...formData.lodging.suites]; s[idx] = { ...s[idx], highlight: v }; handleChange('lodging', 'suites', s); }} placeholder="Ej: Deck frente al mar" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <RPInput label="Capacidad" value={suite.capacity} onChange={v => { const s = [...formData.lodging.suites]; s[idx] = { ...s[idx], capacity: v }; handleChange('lodging', 'suites', s); }} placeholder="2-3 adultos" />
                      <RPInput label="Espacio" value={suite.space} onChange={v => { const s = [...formData.lodging.suites]; s[idx] = { ...s[idx], space: v }; handleChange('lodging', 'suites', s); }} placeholder="30 m²" />
                      <RPInput label="Camas" value={suite.beds} onChange={v => { const s = [...formData.lodging.suites]; s[idx] = { ...s[idx], beds: v }; handleChange('lodging', 'suites', s); }} placeholder="1 King" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <RPInput label="Texto Botón" value={suite.btnText || ''} onChange={v => { const s = [...formData.lodging.suites]; s[idx] = { ...s[idx], btnText: v }; handleChange('lodging', 'suites', s); }} />
                      <RPInput label="URL Botón" value={suite.btnUrl || ''} onChange={v => { const s = [...formData.lodging.suites]; s[idx] = { ...s[idx], btnUrl: v }; handleChange('lodging', 'suites', s); }} placeholder="#buy o https://..." />
                    </div>
                    <RPInput label="Imagen Principal (URL)" value={suite.img} onChange={v => { const s = [...formData.lodging.suites]; s[idx] = { ...s[idx], img: v }; handleChange('lodging', 'suites', s); }} icon={<ImageIcon size={14} />} />
                    {/* Galería de fotos */}
                    <div className="pt-4 border-t border-white/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold tracking-widest uppercase text-white/40">Galería ({(suite.gallery || []).length} fotos)</span>
                        <button
                          onClick={() => { const s = [...formData.lodging.suites]; s[idx] = { ...s[idx], gallery: [...(s[idx].gallery || []), ''] }; handleChange('lodging', 'suites', s); }}
                          className="text-[11px] font-black tracking-wider uppercase transition-opacity hover:opacity-70" style={{ color: accent }}
                        >+ Añadir Foto</button>
                      </div>
                      {(suite.gallery || []).map((photo, pIdx) => (
                        <div key={pIdx} className="flex items-center gap-2">
                          <div className="flex-1">
                            <RPInput label="" placeholder="URL de la imagen" value={photo} icon={<ImageIcon size={13} />}
                              onChange={v => { const s = [...formData.lodging.suites]; const g = [...(s[idx].gallery || [])]; g[pIdx] = v; s[idx] = { ...s[idx], gallery: g }; handleChange('lodging', 'suites', s); }} />
                          </div>
                          <button
                            onClick={() => { const s = [...formData.lodging.suites]; const g = (s[idx].gallery || []).filter((_, i) => i !== pIdx); s[idx] = { ...s[idx], gallery: g }; handleChange('lodging', 'suites', s); }}
                            className="p-3 text-white/20 hover:text-red-400 transition-colors shrink-0"
                          ><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </RPItemCard>
                ))}
              </div>
            )}

            {/* ╔══ PAQUETE CALI ════════════════════════════════════════════╗ */}
            {activeTab === 'caliPackage' && (
              <div className="space-y-5">
                <RPInput label="Título" value={formData.caliPackage.title} onChange={v => handleChange('caliPackage', 'title', v)} />
                <RPTextArea label="Descripción" value={formData.caliPackage.desc} onChange={v => handleChange('caliPackage', 'desc', v)} />
                <RPInput label="Ícono (nombre Lucide React)" value={formData.caliPackage.icon || 'Plane'} onChange={v => handleChange('caliPackage', 'icon', v)} helper="Ejemplos: Plane, Star, Heart, Zap, Package..." />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RPInput label="Texto Botón" value={formData.caliPackage.btnText || ''} onChange={v => handleChange('caliPackage', 'btnText', v)} />
                  <RPInput label="URL Botón" value={formData.caliPackage.btnUrl || ''} onChange={v => handleChange('caliPackage', 'btnUrl', v)} placeholder="#buy o https://..." />
                </div>
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-widest uppercase text-white/40">Beneficios ({formData.caliPackage.items?.length || 0})</span>
                    <button onClick={() => addItem('caliPackage', { title: '', desc: '', hidden: false })} className="flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase transition-opacity hover:opacity-70" style={{ color: accent }}><Plus size={13} /><span>Agregar</span></button>
                  </div>
                  {(formData.caliPackage.items || []).map((item, idx) => (
                    <RPItemCard key={idx} label={item.title || `Beneficio ${idx + 1}`} hidden={!!item.hidden}
                      onToggleHide={() => { const items = [...formData.caliPackage.items]; items[idx] = { ...items[idx], hidden: !item.hidden }; handleChange('caliPackage', 'items', items); }}
                      onMoveUp={() => moveItem('caliPackage', idx, 'up')} onMoveDown={() => moveItem('caliPackage', idx, 'down')}
                      onRemove={() => removeItem('caliPackage', idx)} isFirst={idx === 0} isLast={idx === formData.caliPackage.items.length - 1} compact
                    >
                      <RPInput label="Beneficio" value={item.title} onChange={v => { const items = [...formData.caliPackage.items]; items[idx] = { ...items[idx], title: v }; handleChange('caliPackage', 'items', items); }} />
                      <RPInput label="Detalle" value={item.desc} onChange={v => { const items = [...formData.caliPackage.items]; items[idx] = { ...items[idx], desc: v }; handleChange('caliPackage', 'items', items); }} />
                    </RPItemCard>
                  ))}
                </div>
              </div>
            )}

            {/* ╔══ BOLETERÍA ═══════════════════════════════════════════════╗ */}
            {activeTab === 'tickets' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RPInput label="Título" value={formData.tickets.title} onChange={v => handleChange('tickets', 'title', v)} />
                  <RPInput label="Subtítulo" value={formData.tickets.subtitle} onChange={v => handleChange('tickets', 'subtitle', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-widest uppercase text-white/40">Tiers ({formData.tickets.tiers?.length || 0})</span>
                  <button onClick={() => addItem('tickets', { name: '', price: '', features: [], recommended: false, bgImage: '', btnText: 'COMPRAR AHORA', btnUrl: '#buy', hidden: false })} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black tracking-wider uppercase border transition-all hover:opacity-80" style={{ borderColor: accent + '40', color: accent }}><Plus size={13} /><span>Agregar Tier</span></button>
                </div>
                {(formData.tickets.tiers || []).map((tier, idx) => (
                  <RPItemCard key={idx} label={tier.name || `Tier ${idx + 1}`} hidden={!!tier.hidden}
                    badge={tier.recommended ? '⭐ Recomendado' : undefined}
                    onToggleHide={() => { const t = [...formData.tickets.tiers]; t[idx] = { ...t[idx], hidden: !tier.hidden }; handleChange('tickets', 'tiers', t); }}
                    onMoveUp={() => moveItem('tickets', idx, 'up')} onMoveDown={() => moveItem('tickets', idx, 'down')}
                    onRemove={() => removeItem('tickets', idx)} isFirst={idx === 0} isLast={idx === formData.tickets.tiers.length - 1}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-lg bg-white/4 border border-white/8 w-fit">
                      <input type="checkbox" checked={!!tier.recommended}
                        onChange={e => { const t = formData.tickets.tiers.map((t2, i) => ({ ...t2, recommended: i === idx ? e.target.checked : false })); handleChange('tickets', 'tiers', t); }}
                        className="w-4 h-4 rounded accent-yellow-400" />
                      <span className="text-xs font-bold tracking-wider uppercase text-white/50">Marcar como Recomendado</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <RPInput label="Nombre del Tier" value={tier.name} onChange={v => { const t = [...formData.tickets.tiers]; t[idx] = { ...t[idx], name: v }; handleChange('tickets', 'tiers', t); }} />
                      <RPInput label="Precio" value={tier.price} onChange={v => { const t = [...formData.tickets.tiers]; t[idx] = { ...t[idx], price: v }; handleChange('tickets', 'tiers', t); }} icon={<DollarSign size={14} />} placeholder="$450.000 COP" />
                    </div>
                    <RPInput label="Imagen de Fondo (URL)" value={tier.bgImage || ''} onChange={v => { const t = [...formData.tickets.tiers]; t[idx] = { ...t[idx], bgImage: v }; handleChange('tickets', 'tiers', t); }} icon={<ImageIcon size={14} />} />
                    <RPTextArea label="Características (una por línea)" value={(tier.features || []).join('\n')} onChange={v => { const t = [...formData.tickets.tiers]; t[idx] = { ...t[idx], features: v.split('\n').filter(Boolean) }; handleChange('tickets', 'tiers', t); }} rows={5} placeholder={'Acceso General 3 días\nWelcome Drink\nZona de Descanso'} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <RPInput label="Texto del Botón" value={tier.btnText || 'COMPRAR AHORA'} onChange={v => { const t = [...formData.tickets.tiers]; t[idx] = { ...t[idx], btnText: v }; handleChange('tickets', 'tiers', t); }} />
                      <RPInput label="URL del Botón" value={tier.btnUrl || '#buy'} onChange={v => { const t = [...formData.tickets.tiers]; t[idx] = { ...t[idx], btnUrl: v }; handleChange('tickets', 'tiers', t); }} placeholder="#buy o https://..." />
                    </div>
                  </RPItemCard>
                ))}
              </div>
            )}

            {/* ╔══ COMPRAR ═════════════════════════════════════════════════╗ */}
            {activeTab === 'buy' && (
              <div className="space-y-5">
                <RPInput label="Título de la Sección" value={formData.buy.title} onChange={v => handleChange('buy', 'title', v)} />
                <RPInput label="Descripción Corta" value={formData.buy.description} onChange={v => handleChange('buy', 'description', v)} />
                <div className="p-5 bg-white/4 rounded-xl border border-white/8 space-y-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={15} style={{ color: accent }} />
                    <span className="text-xs font-black tracking-widest uppercase" style={{ color: accent }}>Widget de Compra</span>
                  </div>
                  <RPInput label="URL del Widget (FourVenues u otro)" value={formData.buy.widgetUrl} onChange={v => handleChange('buy', 'widgetUrl', v)} placeholder="https://www.fourvenues.com/assets/iframe/..." />
                  <p className="text-[11px] text-white/25 leading-relaxed">💡 Pega el enlace de FourVenues o cualquier iframe de tickets. El sistema detectará automáticamente el promotor y el evento desde la URL.</p>
                </div>
              </div>
            )}

            {/* ╔══ PREGUNTAS ═══════════════════════════════════════════════╗ */}
            {activeTab === 'faqs' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RPInput label="Título" value={formData.faqs.title} onChange={v => handleChange('faqs', 'title', v)} />
                  <RPInput label="Subtítulo" value={formData.faqs.subtitle} onChange={v => handleChange('faqs', 'subtitle', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-widest uppercase text-white/40">Preguntas ({formData.faqs.items?.length || 0})</span>
                  <button onClick={() => addItem('faqs', { question: '', answer: '', hidden: false })} className="flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase transition-opacity hover:opacity-70" style={{ color: accent }}><Plus size={13} /><span>Agregar</span></button>
                </div>
                {(formData.faqs.items || []).map((item, idx) => (
                  <RPItemCard key={idx} label={item.question ? item.question.substring(0, 40) + (item.question.length > 40 ? '...' : '') : `Pregunta ${idx + 1}`} hidden={!!item.hidden}
                    onToggleHide={() => { const items = [...formData.faqs.items]; items[idx] = { ...items[idx], hidden: !item.hidden }; handleChange('faqs', 'items', items); }}
                    onMoveUp={() => moveItem('faqs', idx, 'up')} onMoveDown={() => moveItem('faqs', idx, 'down')}
                    onRemove={() => removeItem('faqs', idx)} isFirst={idx === 0} isLast={idx === formData.faqs.items.length - 1} compact
                  >
                    <RPInput label="Pregunta" value={item.question} onChange={v => { const items = [...formData.faqs.items]; items[idx] = { ...items[idx], question: v }; handleChange('faqs', 'items', items); }} />
                    <RPTextArea label="Respuesta" value={item.answer} onChange={v => { const items = [...formData.faqs.items]; items[idx] = { ...items[idx], answer: v }; handleChange('faqs', 'items', items); }} rows={3} />
                  </RPItemCard>
                ))}
              </div>
            )}

            {/* ╔══ FOOTER ══════════════════════════════════════════════════╗ */}
            {activeTab === 'footer' && (
              <div className="space-y-5">
                <RPTextArea label="Descripción del Footer" value={formData.footer.description} onChange={v => handleChange('footer', 'description', v)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RPInput label="Dirección / Ubicación" value={formData.footer.address} onChange={v => handleChange('footer', 'address', v)} />
                  <RPInput label="Email de Contacto" value={formData.footer.email} onChange={v => handleChange('footer', 'email', v)} placeholder="contacto@example.com" />
                  <RPInput label="Teléfono" value={formData.footer.phone} onChange={v => handleChange('footer', 'phone', v)} placeholder="+57 300 000 0000" />
                </div>
                <div className="pt-4 border-t border-white/5">
                  <span className="text-xs font-bold tracking-widest uppercase text-white/40 block mb-4">Redes Sociales</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <RPInput label="Instagram" value={formData.footer.social.instagram} onChange={v => handleChange('footer', 'social', { ...formData.footer.social, instagram: v })} icon={<Instagram size={14} />} />
                    <RPInput label="Facebook" value={formData.footer.social.facebook} onChange={v => handleChange('footer', 'social', { ...formData.footer.social, facebook: v })} />
                    <RPInput label="Twitter / X" value={formData.footer.social.twitter} onChange={v => handleChange('footer', 'social', { ...formData.footer.social, twitter: v })} />
                  </div>
                </div>
              </div>
            )}

            {/* ╔══ SEO / SOCIAL ════════════════════════════════════════════╗ */}
            {activeTab === 'seo' && (
              <div className="space-y-6">
                <div className="p-5 bg-white/4 rounded-xl border border-white/8 space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                    <Search size={15} style={{ color: accent }} />
                    <span className="text-xs font-black tracking-widest uppercase" style={{ color: accent }}>Vista Previa Social (WhatsApp / FB / X)</span>
                  </div>
                  <RPInput label="Título Social" value={formData.seo.title} onChange={v => handleChange('seo', 'title', v)} placeholder="Real People | Eventos Exclusivos" />
                  <RPTextArea label="Descripción Social" value={formData.seo.description} onChange={v => handleChange('seo', 'description', v)} rows={3} />
                  <RPInput label="Palabras Clave (Keywords)" value={formData.seo.keywords || ''} onChange={v => handleChange('seo', 'keywords', v)} placeholder="eventos, colombia, musica, real people..." />
                </div>
                <div className="space-y-3">
                  <span className="text-xs font-bold tracking-widest uppercase text-white/40 block">Imagen de Previsualización (1200 × 630 px recomendado)</span>
                  <RPFileUpload label="Subir Imagen SEO" url={formData.seo.image} onFileSelect={(e: any) => handleFileUpload(e, 'seoImage')} isUploading={isUploading === 'seoImage'} onClear={() => handleChange('seo', 'image', '')} accept="image/*" placeholder="Subir imagen (JPG, PNG, WEBP)" />
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
                  <p className="text-[11px] text-emerald-400 leading-relaxed">💡 <strong>Tip:</strong> Después de guardar, si compartes el link en WhatsApp y no ves el cambio, es por caché. Puede tardar unas horas en reflejarse.</p>
                </div>
              </div>
            )}

            {/* ╔══ CONFIGURACIÓN ═══════════════════════════════════════════╗ */}
            {activeTab === 'settings' && (
              <div className="space-y-6">

                {/* General */}
                <div className="p-5 bg-white/4 rounded-xl border border-white/8 space-y-5">
                  <SectionHeader icon={<Settings size={15} />} label="Información General" accent={accent} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <RPInput label="Nombre del Sitio (Pestaña)" value={formData.settings.siteName} onChange={v => handleChange('settings', 'siteName', v)} placeholder="Real People" icon={<Type size={14} />} />
                    <RPInput label="Texto del Menú (Navbar)" value={formData.settings.navBrandText} onChange={v => handleChange('settings', 'navBrandText', v)} placeholder="REAL PEOPLE" />
                    <RPInput label="Número WhatsApp (sin +)" value={formData.settings.whatsappNumber} onChange={v => handleChange('settings', 'whatsappNumber', v)} placeholder="57300000000" icon={<MessageCircle size={14} />} />
                    <RPInput label="Color de Acento" value={formData.settings.accentColor} onChange={v => handleChange('settings', 'accentColor', v)} type="color" />
                  </div>
                </div>

                {/* Logos */}
                <div className="p-5 bg-white/4 rounded-xl border border-white/8 space-y-6">
                  <SectionHeader icon={<ImageIcon size={15} />} label="Identidad Visual (Logos)" accent={accent} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <p className="text-xs font-bold tracking-widest uppercase text-white/40">Logo Navegación (Header)</p>
                      <div className="grid grid-cols-2 gap-3">
                        <RPInput label="Tamaño Desk (px)" value={formData.settings.logoSize} onChange={v => handleChange('settings', 'logoSize', parseInt(v) || 60)} type="number" />
                        <RPInput label="Tamaño Móvil (px)" value={formData.settings.mobileLogoSize} onChange={v => handleChange('settings', 'mobileLogoSize', parseInt(v) || 48)} type="number" />
                      </div>
                      <RPFileUpload label="Subir Logo Principal" url={formData.settings.headerLogoUrl} onFileSelect={(e: any) => handleFileUpload(e, 'headerLogoUrl')} isUploading={isUploading === 'headerLogoUrl'} onClear={() => handleChange('settings', 'headerLogoUrl', '')} accept="image/*" placeholder="PNG transparente recomendado" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-bold tracking-widest uppercase text-white/40">Ícono Pestaña (Favicon)</p>
                      <RPFileUpload label="Subir Favicon" url={formData.settings.faviconUrl} onFileSelect={(e: any) => handleFileUpload(e, 'faviconUrl')} isUploading={isUploading === 'faviconUrl'} onClear={() => handleChange('settings', 'faviconUrl', '')} accept="image/*" placeholder="PNG cuadrado / ICO" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-bold tracking-widest uppercase text-white/40">Logo del Footer</p>
                      <div className="grid grid-cols-2 gap-3">
                        <RPInput label="Tamaño Desk (px)" value={formData.settings.footerLogoSize} onChange={v => handleChange('settings', 'footerLogoSize', parseInt(v) || 80)} type="number" />
                        <RPInput label="Tamaño Móvil (px)" value={formData.settings.footerMobileLogoSize} onChange={v => handleChange('settings', 'footerMobileLogoSize', parseInt(v) || 60)} type="number" />
                      </div>
                      <RPFileUpload label="Subir Logo Footer" url={formData.settings.footerLogoUrl} onFileSelect={(e: any) => handleFileUpload(e, 'footerLogoUrl')} isUploading={isUploading === 'footerLogoUrl'} onClear={() => handleChange('settings', 'footerLogoUrl', '')} accept="image/*" placeholder="Si está vacío usa el principal" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-bold tracking-widest uppercase text-white/40">Logo Admin Panel</p>
                      <RPFileUpload label="Subir Logo Administrador" url={formData.settings.adminLogoUrl} onFileSelect={(e: any) => handleFileUpload(e, 'adminLogoUrl')} isUploading={isUploading === 'adminLogoUrl'} onClear={() => handleChange('settings', 'adminLogoUrl', '')} accept="image/*" placeholder="Aparece en la barra lateral" />
                    </div>
                  </div>
                </div>

                {/* Pantalla de carga */}
                <div className="p-5 bg-white/4 rounded-xl border border-white/8 space-y-5">
                  <SectionHeader icon={<Loader2 size={15} />} label="Pantalla de Carga" accent={accent} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <RPInput label="Texto de Carga" value={formData.settings.loadingText} onChange={v => handleChange('settings', 'loadingText', v)} placeholder="CARGANDO..." />
                    <RPInput label="Color del Cargador" value={formData.settings.loadingColor} onChange={v => handleChange('settings', 'loadingColor', v)} type="color" />
                  </div>
                </div>

                {/* Fondo Global */}
                <div className="p-5 bg-white/4 rounded-xl border border-white/8 space-y-5">
                  <SectionHeader icon={<Monitor size={15} />} label="Fondo Global del Sitio" accent={accent} />
                  <RPSelect label="Tipo de Fondo" value={formData.settings.globalBgType || 'blurred'} onChange={v => handleChange('settings', 'globalBgType', v)}
                    options={[
                      { value: 'blurred', label: '✨ Efecto cristal (usa video/imagen del Hero)' },
                      { value: 'image',   label: '🖼️ Imagen personalizada' },
                      { value: 'color',   label: '🎨 Color sólido' },
                    ]}
                  />
                  {formData.settings.globalBgType === 'color' && (
                    <RPInput label="Color de Fondo" value={formData.settings.globalBgColor || '#000000'} onChange={v => handleChange('settings', 'globalBgColor', v)} type="color" />
                  )}
                  {formData.settings.globalBgType === 'image' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <RPFileUpload label="Fondo Desktop (1920×1080)" url={formData.settings.globalBgImageDesktop} onFileSelect={(e: any) => handleFileUpload(e, 'globalBgImageDesktop')} isUploading={isUploading === 'globalBgImageDesktop'} onClear={() => handleChange('settings', 'globalBgImageDesktop', '')} accept="image/*" placeholder="Subir imagen desktop" />
                      <RPFileUpload label="Fondo Mobile (1080×1920)" url={formData.settings.globalBgImageMobile} onFileSelect={(e: any) => handleFileUpload(e, 'globalBgImageMobile')} isUploading={isUploading === 'globalBgImageMobile'} onClear={() => handleChange('settings', 'globalBgImageMobile', '')} accept="image/*" placeholder="Subir imagen mobile" />
                    </div>
                  )}
                </div>

                {/* Tipografía */}
                <div className="p-5 bg-white/4 rounded-xl border border-white/8 space-y-5">
                  <SectionHeader icon={<Type size={15} />} label="Tipografía" accent={accent} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <RPInput label="Fuente Display (nombre)" value={formData.settings.fontDisplay} onChange={v => handleChange('settings', 'fontDisplay', v)} placeholder="Space Grotesk" />
                      <RPFileUpload label="Archivo Fuente Display (.woff2, .ttf)" url={formData.settings.fontDisplayUrl} onFileSelect={(e: any) => handleFileUpload(e, 'fontDisplayUrl')} isUploading={isUploading === 'fontDisplayUrl'} onClear={() => handleChange('settings', 'fontDisplayUrl', '')} accept=".woff,.woff2,.ttf,.otf" placeholder="Subir archivo de fuente" />
                    </div>
                    <div className="space-y-3">
                      <RPInput label="Fuente Sans (nombre)" value={formData.settings.fontSans} onChange={v => handleChange('settings', 'fontSans', v)} placeholder="Inter" />
                      <RPFileUpload label="Archivo Fuente Sans (.woff2, .ttf)" url={formData.settings.fontSansUrl} onFileSelect={(e: any) => handleFileUpload(e, 'fontSansUrl')} isUploading={isUploading === 'fontSansUrl'} onClear={() => handleChange('settings', 'fontSansUrl', '')} accept=".woff,.woff2,.ttf,.otf" placeholder="Subir archivo de fuente" />
                    </div>
                  </div>
                  <p className="text-[11px] text-white/25 italic">* Si subes un archivo, tendrá prioridad sobre el nombre de Google Fonts.</p>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>

      {/* ═══ MOBILE BOTTOM BAR ═══════════════════════════════════════════════ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[115] bg-black/95 backdrop-blur-xl border-t border-white/10 p-3 flex gap-2">
        {renderSaveBtn('flex-1')}
        <button onClick={handleClose} className="px-4 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all">
          <X size={16} />
        </button>
      </div>

    </div>
  );
};

// ─── Sub-components (prefixed with RP to avoid naming conflicts) ───────────────

const RPInput = ({
  label, value, onChange, type = 'text', icon, placeholder, helper,
}: {
  label: string; value: any; onChange: (v: string) => void;
  type?: string; icon?: React.ReactNode; placeholder?: string; helper?: string;
}) => (
  <div className="space-y-1.5">
    {label && <label className="block text-xs font-bold tracking-wider uppercase text-white/40">{label}</label>}
    <div className="relative">
      {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">{icon}</div>}
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-white/5 border border-white/10 rounded-lg py-3 text-sm text-white placeholder-white/20 focus:border-white/30 focus:outline-none transition-colors ${icon ? 'pl-10 pr-4' : 'px-4'} ${type === 'color' ? 'h-12 cursor-pointer p-1' : ''}`}
        style={{ fontSize: '16px' }}
      />
    </div>
    {helper && <p className="text-[11px] text-white/30 leading-relaxed">{helper}</p>}
  </div>
);

const RPTextArea = ({
  label, value, onChange, rows = 4, placeholder, helper,
}: {
  label: string; value: string; onChange: (v: string) => void;
  rows?: number; placeholder?: string; helper?: string;
}) => (
  <div className="space-y-1.5">
    {label && <label className="block text-xs font-bold tracking-wider uppercase text-white/40">{label}</label>}
    <textarea
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-sm text-white placeholder-white/20 focus:border-white/30 focus:outline-none transition-colors resize-y"
      style={{ fontSize: '16px' }}
    />
    {helper && <p className="text-[11px] text-white/30 leading-relaxed">{helper}</p>}
  </div>
);

const RPSelect = ({
  label, value, onChange, options, helper,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; helper?: string;
}) => (
  <div className="space-y-1.5">
    {label && <label className="block text-xs font-bold tracking-wider uppercase text-white/40">{label}</label>}
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:border-white/30 focus:outline-none transition-colors appearance-none cursor-pointer"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.3)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.2em',
        fontSize: '16px',
      }}
    >
      {options.map(opt => <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">{opt.label}</option>)}
    </select>
    {helper && <p className="text-[11px] text-white/30 leading-relaxed">{helper}</p>}
  </div>
);

const isImageUrl = (url?: string | null) =>
  !!url && (/\.(jpg|jpeg|png|webp|gif|svg|avif|ico)(\?|$)/i.test(url) || url.includes('r2.dev') || url.includes('/storage/'));

const isFontUrl = (url?: string | null) =>
  !!url && /\.(woff2?|ttf|otf)(\?|$)/i.test(url);

const RPFileUpload = ({
  label, url, onFileSelect, isUploading, onClear,
  accept = 'image/*', placeholder = 'Subir Archivo',
}: {
  label: string; url?: string; onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean; onClear: () => void; accept?: string; placeholder?: string;
}) => (
  <div className="space-y-1.5">
    {label && <label className="block text-xs font-bold tracking-wider uppercase text-white/40">{label}</label>}
    {url ? (
      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        {isImageUrl(url) && (
          <img src={url} alt="Preview" className="w-full h-28 object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 overflow-hidden">
            {isFontUrl(url)
              ? <Type size={14} className="text-amber-400 shrink-0" />
              : <ImageIcon size={14} className="text-emerald-400 shrink-0" />}
            <span className="text-xs text-white/50 truncate">
              {isFontUrl(url) ? 'Fuente cargada' : 'Imagen cargada'}
            </span>
          </div>
          <button onClick={onClear} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all shrink-0">
            <X size={13} />
          </button>
        </div>
      </div>
    ) : (
      <label className="flex flex-col items-center justify-center w-full py-7 px-4 bg-white/4 border border-dashed border-white/15 rounded-lg cursor-pointer hover:bg-white/6 hover:border-white/30 transition-all gap-2">
        <input type="file" className="hidden" accept={accept} onChange={onFileSelect} disabled={isUploading} />
        {isUploading ? <Loader2 size={20} className="animate-spin text-white/30" /> : <Plus size={20} className="text-white/20" />}
        <span className="text-[11px] text-white/25 font-bold uppercase tracking-widest text-center">
          {isUploading ? 'Subiendo...' : placeholder}
        </span>
      </label>
    )}
  </div>
);

const SectionHeader = ({ icon, label, accent }: { icon: React.ReactNode; label: string; accent: string }) => (
  <div className="flex items-center gap-2 pb-3 border-b border-white/5">
    <div style={{ color: accent }}>{icon}</div>
    <span className="text-xs font-black tracking-widest uppercase" style={{ color: accent }}>{label}</span>
  </div>
);

interface RPItemCardProps {
  key?: any;
  label: string; hidden: boolean; badge?: string;
  onToggleHide: () => void; onMoveUp: () => void; onMoveDown: () => void; onRemove: () => void;
  isFirst: boolean; isLast: boolean; compact?: boolean; children: React.ReactNode;
}

const RPItemCard = ({ label, hidden, badge, onToggleHide, onMoveUp, onMoveDown, onRemove, isFirst, isLast, compact = false, children }: RPItemCardProps) => (
  <div className={`rounded-xl border transition-all ${hidden ? 'border-red-500/20 opacity-60 grayscale' : 'border-white/8'}`}>
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="text-xs font-black tracking-wider uppercase text-white/40 truncate">{label}</span>
        {badge && <span className="text-[9px] font-black tracking-widest bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full uppercase shrink-0">{badge}</span>}
        {hidden && <span className="text-[9px] font-black tracking-widest bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full uppercase shrink-0">Oculto</span>}
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <button onClick={onToggleHide} className={`p-2 rounded-lg transition-all ${hidden ? 'text-red-400 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}>{hidden ? <EyeOff size={14} /> : <Eye size={14} />}</button>
        <button onClick={onMoveUp} disabled={isFirst} className="p-2 rounded-lg text-white/25 hover:text-white hover:bg-white/5 disabled:opacity-20 transition-all"><ChevronUp size={14} /></button>
        <button onClick={onMoveDown} disabled={isLast} className="p-2 rounded-lg text-white/25 hover:text-white hover:bg-white/5 disabled:opacity-20 transition-all"><ChevronDown size={14} /></button>
        <button onClick={onRemove} className="p-2 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
      </div>
    </div>
    <div className={`${compact ? 'p-4' : 'p-5'} space-y-4`}>{children}</div>
  </div>
);
