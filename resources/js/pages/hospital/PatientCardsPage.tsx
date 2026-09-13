import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import type { Paginated, Patient } from '@/types';
import { useQuery } from '@tanstack/vue-query';
import { defineComponent, ref } from 'vue';
import { RouterLink } from 'vue-router';

function ageFromBirthDate(birthDate: string | undefined): string {
  if (!birthDate) return '—';
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? `${age} ans` : '—';
}

const CARD_WIDTH_PX = 4537;
const CARD_HEIGHT_PX = 2884;

const CARD_CSS = `
  .card {
    width: ${CARD_WIDTH_PX}px;
    height: ${CARD_HEIGHT_PX}px;
    background: #fff;
    overflow: hidden;
    position: relative;
    border-radius: 96px;
    border: 2px solid #e5e7eb;
  }
  .card-top {
    height: 380px;
    background: #0d9488;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 80px;
  }
  .card-logo-img {
    height: 240px;
    width: auto;
    object-fit: contain;
    filter: brightness(0) invert(1);
  }
  .card-body {
    padding: 360px 400px 320px;
    display: flex;
    gap: 100px;
    align-items: flex-start;
  }
  .card-photo-wrap {
    width: 880px;
    height: 1100px;
    flex-shrink: 0;
    border-radius: 64px;
    overflow: hidden;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .card-photo-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .card-photo-placeholder {
    font-size: 320px;
    font-weight: 700;
    color: #cbd5e1;
    letter-spacing: -0.02em;
  }
  .card-content { flex: 1; min-width: 0; }
  .card-iup {
    font-family: ui-monospace, monospace;
    font-size: 72px;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: #0d9488;
    margin-bottom: 40px;
  }
  .card-name {
    font-size: 200px;
    font-weight: 700;
    line-height: 1.08;
    color: #111827;
    letter-spacing: -0.02em;
    margin-bottom: 72px;
  }
  .card-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 44px 100px;
    font-size: 76px;
    line-height: 1.4;
  }
  .card-field {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .card-field-label {
    color: #6b7280;
    font-weight: 500;
    font-size: 60px;
  }
  .card-field-value {
    color: #111827;
    font-weight: 600;
  }
  .card-urgency {
    margin-top: 64px;
    padding: 36px 44px;
    background: #f0fdfa;
    border-radius: 48px;
    font-size: 64px;
    color: #6b7280;
    border: 1px solid #ccfbf1;
  }
  .card-urgency strong { color: #111827; }
`;

function getPatientInitials(patient: Patient): string {
  if (patient.first_name && patient.last_name)
    return (patient.first_name[0] ?? '') + (patient.last_name[0] ?? '');
  const parts = (patient.full_name ?? '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '');
  return (patient.full_name ?? '?').slice(0, 2).toUpperCase();
}

function buildCardHtml(patient: Patient, baseUrl: string): string {
  const age = ageFromBirthDate(patient.birth_date);
  const emergency = patient.emergency_contact ?? patient.emergency_contact_name ?? patient.emergency_contact_phone ?? '—';
  const address = (patient.address ?? '—').slice(0, 50) + ((patient.address?.length ?? 0) > 50 ? '…' : '');
  const emergencyStr = String(emergency).slice(0, 50) + (String(emergency).length > 50 ? '…' : '');
  const logoUrl = `${baseUrl.replace(/\/$/, '')}/DoniSante-logo.png`;
  const photoHtml = patient.photo_url
    ? `<img src="${patient.photo_url}" alt="" />`
    : `<span class="card-photo-placeholder">${getPatientInitials(patient)}</span>`;
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Carte patient — ${patient.full_name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; background: #eef0f5; padding: 24px; display: flex; flex-direction: column; align-items: center; }
    @media print {
      body { background: white; padding: 0; }
      .no-print { display: none !important; }
      .card-wrap { box-shadow: none !important; transform: none !important; }
      .card { box-shadow: none !important; }
      @page { size: ${CARD_WIDTH_PX}px ${CARD_HEIGHT_PX}px; margin: 0; }
    }
    .card-wrap { transform: scale(0.12); transform-origin: top center; }
    ${CARD_CSS}
    .no-print { margin-top: 24px; }
    .no-print button { margin: 0 8px; padding: 12px 24px; cursor: pointer; border-radius: 12px; border: none; background: #0d9488; color: white; font-weight: 600; font-size: 16px; }
    .no-print button.secondary { background: #e2e8f0; color: #475569; }
  </style>
</head>
<body>
  <div class="card-wrap">
    <div class="card">
      <div class="card-top">
        <img class="card-logo-img" src="${logoUrl}" alt="DoniSanté" />
      </div>
      <div class="card-body">
        <div class="card-photo-wrap">${photoHtml}</div>
        <div class="card-content">
          <div class="card-iup">${patient.iup}</div>
          <div class="card-name">${patient.full_name}</div>
          <div class="card-grid">
            <div class="card-field">
              <span class="card-field-label">Naissance</span>
              <span class="card-field-value">${patient.birth_date ?? '—'} (${age})</span>
            </div>
            <div class="card-field">
              <span class="card-field-label">Sexe</span>
              <span class="card-field-value">${patient.sex ?? '—'}</span>
            </div>
            <div class="card-field">
              <span class="card-field-label">Téléphone</span>
              <span class="card-field-value">${patient.phone ?? '—'}</span>
            </div>
            <div class="card-field">
              <span class="card-field-label">Adresse</span>
              <span class="card-field-value">${address}</span>
            </div>
          </div>
          <div class="card-urgency"><strong>Contact urgence</strong> ${emergencyStr}</div>
        </div>
      </div>
    </div>
  </div>
  <div class="no-print">
    <button onclick="window.print()">Imprimer / Enregistrer en PDF</button>
    <button class="secondary" onclick="window.close()">Fermer</button>
  </div>
</body>
</html>`;
}

function buildSingleCardInner(p: Patient, baseUrl: string): string {
  const age = ageFromBirthDate(p.birth_date);
  const emergency = p.emergency_contact ?? p.emergency_contact_name ?? p.emergency_contact_phone ?? '—';
  const address = (p.address ?? '—').slice(0, 50) + ((p.address?.length ?? 0) > 50 ? '…' : '');
  const emergencyStr = String(emergency).slice(0, 50) + (String(emergency).length > 50 ? '…' : '');
  const logoUrl = `${baseUrl.replace(/\/$/, '')}/DoniSante-logo.png`;
  const photoHtml = p.photo_url
    ? `<img src="${p.photo_url}" alt="" />`
    : `<span class="card-photo-placeholder">${getPatientInitials(p)}</span>`;
  return `
    <div class="card">
      <div class="card-top">
        <img class="card-logo-img" src="${logoUrl}" alt="DoniSanté" />
      </div>
      <div class="card-body">
        <div class="card-photo-wrap">${photoHtml}</div>
        <div class="card-content">
          <div class="card-iup">${p.iup}</div>
          <div class="card-name">${p.full_name}</div>
          <div class="card-grid">
            <div class="card-field">
              <span class="card-field-label">Naissance</span>
              <span class="card-field-value">${p.birth_date ?? '—'} (${age})</span>
            </div>
            <div class="card-field">
              <span class="card-field-label">Sexe</span>
              <span class="card-field-value">${p.sex ?? '—'}</span>
            </div>
            <div class="card-field">
              <span class="card-field-label">Téléphone</span>
              <span class="card-field-value">${p.phone ?? '—'}</span>
            </div>
            <div class="card-field">
              <span class="card-field-label">Adresse</span>
              <span class="card-field-value">${address}</span>
            </div>
          </div>
          <div class="card-urgency"><strong>Contact urgence</strong> ${emergencyStr}</div>
        </div>
      </div>
    </div>`;
}

function printCardsInWindow(patients: Patient[]): void {
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Cartes patients — DoniSanté</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #e2e8f0; padding: 24px; }
    @media print {
      body { background: white; padding: 0; }
      .no-print { display: none !important; }
      .card-wrap { box-shadow: none !important; }
      @page { size: ${CARD_WIDTH_PX}px ${CARD_HEIGHT_PX}px; margin: 0; }
      .card { box-shadow: none !important; }
      .card-page { break-after: page; transform: none !important; margin: 0 !important; }
      .card-page:last-child { break-after: auto; }
    }
    .card-page {
      width: ${CARD_WIDTH_PX}px;
      height: ${CARD_HEIGHT_PX}px;
      position: relative;
      transform: scale(0.12);
      transform-origin: top left;
      margin-bottom: 24px;
    }
    ${CARD_CSS}
    .no-print { text-align: center; margin-top: 24px; }
    .no-print button { margin: 0 8px; padding: 12px 24px; cursor: pointer; border-radius: 12px; border: none; background: #0d9488; color: white; font-weight: 600; font-size: 16px; }
    .no-print button.secondary { background: #e2e8f0; color: #475569; }
  </style>
</head>
<body>
  ${patients.map((p) => `<div class="card-page">${buildSingleCardInner(p, typeof window !== 'undefined' ? window.location.origin : '')}</div>`).join('')}
  <div class="no-print">
    <button onclick="window.print()">Imprimer / Enregistrer en PDF</button>
    <button class="secondary" onclick="window.close()">Fermer</button>
  </div>
</body>
</html>`;
  const w = window.open('', '_blank', 'width=900,height=700');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

export default defineComponent({
  name: 'PatientCardsPage',
  setup() {
    const query = ref('');
    const page = ref(1);

    const { data, isLoading } = useQuery({
      queryKey: ['patients', query, page],
      queryFn: async () => {
        const { data: res } = await api.get<Paginated<Patient>>('/patients', {
          params: { query: query.value || undefined, page: page.value, limit: 20 },
        });
        return res;
      },
    });

    const selectedIds = ref<Set<number>>(new Set());

    function printOne(patient: Patient) {
      const w = window.open('', '_blank', 'width=400,height=420');
      if (w) {
        w.document.write(buildCardHtml(patient, window.location.origin));
        w.document.close();
      }
    }

    function toggleSelect(id: number) {
      const next = new Set(selectedIds.value);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      selectedIds.value = next;
    }

    function printSelected() {
      if (!data.value?.data) return;
      const toPrint = data.value.data.filter((p) => selectedIds.value.has(p.id));
      if (toPrint.length === 0) return;
      printCardsInWindow(toPrint);
    }

    return () => (
      <div class="space-y-6 sm:space-y-8">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Cartes patients
            </h1>
            <p class="mt-1 text-slate-600">
              Générer et imprimer les cartes patients au format standard
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button
              variant="outline"
              class="rounded-xl"
              disabled={selectedIds.value.size === 0}
              onClick={printSelected}
            >
              Imprimer la sélection ({selectedIds.value.size})
            </Button>
            <RouterLink to="/hospital/patients">
              <Button variant="outline" class="rounded-xl">
                Voir tous les patients
              </Button>
            </RouterLink>
          </div>
        </div>

        <div class="flex flex-col gap-4 sm:flex-row">
          <div class="min-w-0 flex-1 sm:max-w-md">
            <Input v-model={query.value} placeholder="Rechercher un patient (nom, IUP)..." />
          </div>
        </div>

        <Card class="overflow-hidden shadow-lg">
          <div class="border-b border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-6">
            <h3 class="text-lg font-semibold text-slate-800">Patients</h3>
            <p class="mt-1 text-sm text-slate-500">Sélectionnez les patients puis imprimez les cartes</p>
          </div>
          {isLoading.value ? (
            <div class="flex justify-center py-16">
              <Spinner />
            </div>
          ) : !data.value?.data?.length ? (
            <div class="p-12">
              <EmptyState
                title="Aucun patient"
                description="Aucun patient ne correspond à votre recherche."
              />
            </div>
          ) : (
            <div class="divide-y divide-slate-100">
              {data.value?.data.map((p) => (
                <div
                  key={p.id}
                  class="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div class="flex min-w-0 flex-1 items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.value.has(p.id)}
                      onInput={() => toggleSelect(p.id)}
                      class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <div class="min-w-0">
                      <p class="font-semibold text-slate-800">{p.full_name}</p>
                      <p class="mt-0.5 font-mono text-sm text-slate-500">IUP: {p.iup}</p>
                      <p class="text-sm text-slate-600">{p.birth_date ?? '—'} — {p.phone ?? '—'}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    class="shrink-0 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => printOne(p)}
                  >
                    Imprimer la carte
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  },
});
