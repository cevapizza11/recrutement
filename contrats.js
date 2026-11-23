/* =====================================================================
   MODÈLES DE DOCUMENTS — Recrutement Moule & Smile
   Contrats rédigés selon le Code du travail et la convention collective
   HCR (IDCC 1979). ⚠️ À faire relire par Exco avant la première utilisation.
   ===================================================================== */

const TYPES_CONTRAT = {
  cdd_saison:   { label: 'CDD saisonnier', court: 'CDD saisonnier' },
  extra:        { label: "Extra — CDD d'usage", court: 'Extra' },
  cdi_annualise:{ label: 'CDI annualisé (temps de travail aménagé sur l\'année)', court: 'CDI annualisé' }
};

// ---------- outils ----------
const _e = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const _d = iso => iso ? iso.slice(0, 10).split('-').reverse().join('/') : '…………';
const _eur = n => (Math.round(n * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const _v = (x, def) => (x === undefined || x === null || x === '') ? (def ?? '…………………') : _e(x);
// Civilité : 'M.', 'Mme' ou 'NG' (non genré → formulations neutres, pas de civilité imprimée)
const _ng = c => c.civilite !== 'M.' && c.civilite !== 'Mme';
function _civ(c) { return _ng(c) ? '' : _e(c.civilite) + ' '; }
function _ne(c) { return c.civilite === 'Mme' ? 'née' : c.civilite === 'M.' ? 'né' : 'né(e)'; }
function _il(c) { return c.civilite === 'Mme' ? 'la salariée' : c.civilite === 'M.' ? 'le salarié' : 'la personne salariée'; }
function _Il(c) { return c.civilite === 'Mme' ? 'La salariée' : c.civilite === 'M.' ? 'Le salarié' : 'La personne salariée'; }
function _du(c) { return c.civilite === 'Mme' ? 'de la salariée' : c.civilite === 'M.' ? 'du salarié' : 'de la personne salariée'; }
function _au(c) { return c.civilite === 'Mme' ? 'à la salariée' : c.civilite === 'M.' ? 'au salarié' : 'à la personne salariée'; }

/** Salaire mensuel brut avec majorations HCR des heures au-delà de 35 h
 *  (36e à 39e : +10 % ; 40e à 43e : +20 % ; 44e et + : +50 %). */
function calculPaie(heuresHebdo, taux) {
  const h = Number(heuresHebdo) || 0, t = Number(taux) || 0, k = 52 / 12;
  const base = Math.min(h, 35), t10 = Math.max(0, Math.min(h, 39) - 35), t20 = Math.max(0, Math.min(h, 43) - 39), t50 = Math.max(0, h - 43);
  const mensuel = (base * t + t10 * t * 1.10 + t20 * t * 1.20 + t50 * t * 1.50) * k;
  return { heuresMois: Math.round(h * k * 100) / 100, mensuel: Math.round(mensuel * 100) / 100, t10, t20, t50 };
}

/** Période d'essai par défaut.
 *  CDD : 1 jour par semaine de contrat, maximum 2 semaines si le contrat fait 6 mois ou moins, 1 mois au-delà (art. L.1242-10).
 *  CDI employé : 2 mois (art. L.1221-19) — vérifier la durée prévue par la convention HCR avec Exco. */
function essaiParDefaut(type, debut, fin) {
  if (type === 'extra') return 'aucune';
  if (type === 'cdi_annualise') return '2 mois';
  if (!debut || !fin) return '…… jours';
  const jours = Math.round((new Date(fin) - new Date(debut)) / 86400000) + 1;
  const semaines = Math.floor(jours / 7);
  const mois = jours / 30.4;
  if (mois > 6) return '1 mois';
  return Math.max(1, Math.min(14, semaines)) + ' jour' + (Math.min(14, semaines) > 1 ? 's' : '');
}

function _style() {
  return `<style>
  body{font-family:Georgia,'Times New Roman',serif;font-size:11pt;line-height:1.45;color:#111;margin:0}
  .doc{max-width:720px;margin:0 auto;padding:10px 24px}
  h1{font-size:15pt;text-align:center;margin:6px 0 2px;letter-spacing:.5px}
  .sous{text-align:center;font-size:10pt;color:#444;margin-bottom:16px}
  h2{font-size:11pt;margin:14px 0 4px;text-transform:uppercase;border-bottom:1px solid #999;padding-bottom:2px}
  p{margin:4px 0 6px;text-align:justify}
  .parties{border:1px solid #bbb;padding:8px 12px;margin:8px 0}
  table{border-collapse:collapse;width:100%;font-size:10pt;margin:6px 0}
  td,th{border:1px solid #999;padding:4px 6px;text-align:left}
  table.sign{margin-top:22px;border:none}
  table.sign td{border:none;width:50%;height:110px;vertical-align:top;font-size:10pt;padding:0 10px 0 0}
  .petit{font-size:9pt;color:#444}
  </style>`;
}
function _entete(D, titre, sousTitre) {
  const E = D.E;
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${_e(titre)}</title>${_style()}</head><body><div class="doc">
  <h1>${_e(titre)}</h1><div class="sous">${_e(sousTitre || '')}</div>`;
}
function _parties(D) {
  const E = D.E, c = D.c;
  const naiss = `${_ne(c)} le ${_d(c.naissance)} à ${_v(c.lieuNaissance)} (${_v(c.deptNaissance)})`;
  return `<div class="parties"><p><b>ENTRE LES SOUSSIGNÉS :</b></p>
  <p>La société <b>${_v(E.raison)}</b>, ${_v(E.forme)}${E.capital ? ' au capital de ' + _e(E.capital) + ' €' : ''}, dont le siège social est situé ${_v(E.siege)}, immatriculée sous le n° SIRET ${_v(E.siret)}, code NAF ${_v(E.naf)}, exploitant le restaurant à l'enseigne « ${_v(E.enseigne)} », cotisant à l'${_v(E.urssaf)}, représentée par M. ${_v(E.representant)}, en sa qualité de ${_v(E.qualite)},</p>
  <p style="text-align:right">ci-après dénommée « l'employeur »,</p>
  <p><b>ET :</b></p>
  <p>${_civ(c)}<b>${_v(c.prenom)} ${_v(c.nom)}</b>${c.nomNaissance ? ' (nom de naissance : ' + _e(c.nomNaissance) + ')' : ''}, ${naiss}${c.nationalite ? ', de nationalité ' + _e(c.nationalite) : ''}, demeurant ${_v(c.adresse)}, ${_v(c.cp)} ${_v(c.ville)}, n° de Sécurité sociale : ${c.secuAttente === 'oui' ? 'en cours d\'attribution' : _v(c.secu)}${c.mineur ? `, mineur(e), agissant avec l'autorisation de son représentant légal, ${_v(c.parentNom)} (${_v(c.parentLien)})` : ''},</p>
  <p style="text-align:right">ci-après dénommé(e) « ${_il(c)} »,</p>
  <p><b>IL A ÉTÉ CONVENU CE QUI SUIT :</b></p></div>`;
}
function _commun_fin(D, n) {
  // articles communs : protection sociale, tenue, hygiène, obligations, convention, DPAE
  const E = D.E, c = D.c;
  let a = n;
  return `
  <h2>Article ${a++} – Protection sociale</h2>
  <p>${_Il(c)} sera affilié(e) au régime général de la Sécurité sociale, à la caisse de retraite complémentaire ${_v(E.retraite, 'désignée par l\'employeur')}, au régime de prévoyance ${_v(E.prevoyance, 'prévu par la convention collective HCR')} et au régime frais de santé (mutuelle) obligatoire de l'entreprise ${_v(E.mutuelle, 'prévu par la convention collective HCR')}, sauf cas de dispense prévus par la loi, justifiés par écrit.</p>
  <h2>Article ${a++} – Tenue de travail</h2>
  <p>Le port de la tenue de l'établissement est obligatoire pendant le service. Elle est fournie gratuitement par l'employeur, reste sa propriété et devra être restituée en bon état à la fin du contrat. Sa remise fait l'objet d'un bon signé par les deux parties.</p>
  <h2>Article ${a++} – Hygiène, sécurité et santé</h2>
  <p>${_Il(c)} s'engage à respecter les règles d'hygiène alimentaire (méthode HACCP), de sécurité et les consignes affichées dans l'établissement, ainsi que le règlement intérieur s'il existe. ${_Il(c)} bénéficiera d'une visite d'information et de prévention auprès du service de prévention et de santé au travail${E.santeTravail ? ' ' + _e(E.santeTravail) : ''}${c.mineur ? ', préalablement à son affectation sur le poste, conformément aux règles applicables aux travailleurs mineurs' : ''}.</p>
  <h2>Article ${a++} – Obligations professionnelles</h2>
  <p>${_Il(c)} s'engage à observer les instructions de l'employeur, à faire preuve de discrétion sur les informations relatives à l'entreprise et à prévenir l'employeur de toute absence le plus tôt possible, avec justificatif sous 48 heures.</p>
  <h2>Article ${a++} – Convention collective et formalités</h2>
  <p>Le présent contrat est régi par le Code du travail et par la convention collective nationale des Hôtels, Cafés, Restaurants (HCR) du 30 avril 1997 (IDCC 1979), consultable dans l'établissement. La déclaration préalable à l'embauche a été effectuée auprès de l'${_v(E.urssaf)}${D.v.dpaeNumero ? ' (n° ' + _e(D.v.dpaeNumero) + ')' : ''}. ${_Il(c)} dispose d'un droit d'accès et de rectification sur les informations la/le concernant.</p>`;
}
function _signatures(D) {
  const c = D.c, E = D.E;
  return `<p style="margin-top:16px">Fait à ${_v(E.villeSignature)}, le ${_d(D.v.dateSignature)}, en deux exemplaires originaux, dont un remis à ${_il(c)}.</p>
  <table class="sign"><tr><td><b>L'employeur</b><br>${_v(E.representant)}, ${_v(E.qualite)}<br><span class="petit">Signature</span></td>
  <td><b>${_Il(c)}</b><br>${_v(c.prenom)} ${_v(c.nom)}<br><span class="petit">Mention manuscrite « Lu et approuvé » et signature</span></td></tr></table>
  ${c.mineur ? `<table class="sign"><tr><td></td><td><b>Le représentant légal</b><br>${_v(c.parentNom)}<br><span class="petit">« Lu et approuvé, bon pour autorisation » et signature</span></td></tr></table>` : ''}
  </div></body></html>`;
}
function _remuneration(D, n) {
  const v = D.v, P = calculPaie(v.heures, v.taux);
  let detail = `Pour un horaire hebdomadaire de ${_e(v.heures)} heures, soit ${String(P.heuresMois).replace('.', ',')} heures mensuelles, la rémunération mensuelle brute s'élève à <b>${_eur(P.mensuel)}</b> sur la base d'un taux horaire brut de <b>${_eur(v.taux)}</b>`;
  if (P.t10 || P.t20 || P.t50) detail += `, heures accomplies au-delà de 35 heures incluses avec leurs majorations conventionnelles (10 % de la 36e à la 39e heure, 20 % de la 40e à la 43e, 50 % au-delà)`;
  return `<h2>Article ${n} – Rémunération</h2><p>${detail}. Les heures supplémentaires éventuelles seront rémunérées ou récupérées conformément à la convention collective HCR.</p>
  <h2>Article ${n + 1} – Avantage en nature nourriture</h2><p>${_Il(D.c)} bénéficie des repas pris sur place pendant ses heures de présence, conformément à la convention collective HCR. Cet avantage en nature est évalué sur la base du minimum garanti (${_eur(D.P.mg)} par repas à la date du contrat) et figure sur le bulletin de paie.</p>`;
}
const _JOURS = [['lun', 'lundi'], ['mar', 'mardi'], ['mer', 'mercredi'], ['jeu', 'jeudi'], ['ven', 'vendredi'], ['sam', 'samedi'], ['dim', 'dimanche']];
function _clauseTempsPartiel(D, n) {
  const v = D.v, c = D.c, rep = v.repartition || {};
  const lignes = _JOURS.map(([k, l]) => `<tr><td>${l}</td><td>${Number(rep[k]) ? String(rep[k]).replace('.', ',') + ' h' : 'repos'}</td></tr>`).join('');
  const motif = { demande: `à la demande écrite et motivée ${_du(c)} (contraintes personnelles ou cumul d'activités), annexée au présent contrat`, etudiant: `${_il(c)} étant étudiant(e) de moins de 26 ans`, court: 'le contrat étant d\'une durée au plus égale à sept jours' }[v.motif24];
  return `<h2>Article ${n} – Travail à temps partiel</h2>
  <p>${_Il(c)} est engagé(e) à <b>temps partiel</b>, pour une durée hebdomadaire de <b>${_v(v.heures)} heures</b>${Number(v.heures) < 24 && motif ? ', inférieure à la durée minimale légale de 24 heures, ' + motif : ''}. Conformément à l'article L.3123-6 du Code du travail, cette durée est répartie entre les jours de la semaine comme suit :</p>
  <table><tr><th>Jour</th><th>Durée</th></tr>${lignes}</table>
  <p>Les horaires de travail de chaque journée sont communiqués par écrit, par le planning affiché et transmis au moins 7 jours à l'avance. Cette répartition pourra être modifiée, sous réserve d'un délai de prévenance de 7 jours, dans les cas suivants : surcroît d'activité saisonnière, variation de la fréquentation liée aux conditions météorologiques ou aux événements de la station, absence d'un autre salarié.</p>
  <p>${_Il(c)} pourra être amené(e) à effectuer des heures complémentaires dans la limite du dixième de la durée hebdomadaire prévue au contrat ; chacune d'elles donne lieu à une majoration de salaire de 10 %. Les heures complémentaires ne peuvent avoir pour effet de porter la durée du travail au niveau de la durée légale. ${_Il(c)} bénéficie des mêmes droits que les salariés à temps complet.</p>`;
}
function _clausesMineur(D, n) {
  return `<h2>Article ${n} – Dispositions propres au salarié mineur</h2>
  <p>${_Il(D.c)} étant âgé(e) de moins de 18 ans, l'employeur s'engage à respecter les règles protectrices applicables aux jeunes travailleurs, notamment : durée de travail limitée à 8 heures par jour et 35 heures par semaine ; pause d'au moins 30 minutes consécutives dès que le temps de travail quotidien atteint 4 h 30 ; repos quotidien d'au moins 12 heures consécutives ; deux jours de repos hebdomadaire consécutifs ; travail de nuit uniquement dans les limites des dérogations prévues par le Code du travail pour le secteur de la restauration. ${_Il(D.c)} ne sera pas affecté(e) au service ni à la préparation de boissons alcoolisées.</p>
  <p>Le présent contrat est conclu avec l'autorisation écrite du représentant légal, annexée au contrat. La rémunération ne pourra être inférieure au minimum légal applicable compte tenu de l'âge et de l'expérience du salarié.</p>`;
}

// =====================================================================
// CDD SAISONNIER
// =====================================================================
function contratCDDSaison(D) {
  const c = D.c, v = D.v, E = D.E;
  let n = 1, h = _entete(D, 'CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE', 'Emploi à caractère saisonnier — articles L.1242-2 3° et L.1242-12 du Code du travail') + _parties(D);
  h += `<h2>Article ${n++} – Engagement et motif du recours</h2>
  <p>${_Il(c)} est engagé(e) par contrat à durée déterminée pour pourvoir un <b>emploi à caractère saisonnier</b>, lié à l'activité touristique saisonnière du restaurant « ${_v(E.enseigne)} », dont l'ouverture est limitée à la saison (article L.1242-2 3° du Code du travail).</p>
  <h2>Article ${n++} – Durée du contrat</h2>
  <p>Le présent contrat est conclu pour une durée déterminée <b>du ${_d(v.debut)} au ${_d(v.fin)} inclus</b>. Il prendra fin automatiquement à cette date sans formalité. Le premier jour de travail est fixé au ${_d(v.debut)}${v.heureDebut ? ' à ' + _e(v.heureDebut) : ''}.</p>
  <h2>Article ${n++} – Période d'essai</h2>
  <p>Le contrat ne deviendra définitif qu'à l'issue d'une période d'essai de <b>${_v(v.essai)}</b> de travail effectif, pendant laquelle chacune des parties pourra y mettre fin sans indemnité, dans le respect du délai de prévenance légal.</p>
  <h2>Article ${n++} – Fonctions et classification</h2>
  <p>${_Il(c)} occupera l'emploi d'<b>${_v(v.poste, 'équipier(ère) polyvalent(e) de restauration')}</b>, classé ${_v(v.niveau)} de la grille de classification de la convention collective HCR. Ses missions comprennent notamment la préparation et le service des plats et boissons (poste moules, frites, bar et salle selon le planning), l'accueil des clients, le nettoyage et la plonge selon un roulement, dans le respect des règles d'hygiène. Ces fonctions pourront évoluer selon les besoins du service.</p>
  <h2>Article ${n++} – Lieu de travail</h2>
  <p>${_Il(c)} exercera ses fonctions au restaurant « ${_v(E.enseigne)} », ${_v(E.lieu)}.</p>
  <h2>Article ${n++} – Durée et horaires de travail</h2>
  <p>La durée hebdomadaire de travail est fixée à <b>${_v(v.heures)} heures</b>. Les horaires sont fixés par le planning établi par l'employeur et communiqué à l'avance ; ils peuvent comprendre le travail en soirée, les week-ends et les jours fériés, compte tenu de l'activité saisonnière. ${_Il(c)} bénéficie des repos quotidien et hebdomadaire prévus par la loi et la convention collective HCR.</p>`;
  if (Number(v.heures) < 35) h += _clauseTempsPartiel(D, n++);
  h += _remuneration(D, n); n += 2;
  h += `<h2>Article ${n++} – Congés payés et fin de contrat</h2>
  <p>${_Il(c)} acquiert des congés payés à raison de 2,5 jours ouvrables par mois de travail effectif. Les congés non pris à la fin du contrat donneront lieu au versement d'une indemnité compensatrice égale au dixième de la rémunération brute totale perçue. Conformément à l'article L.1243-10 du Code du travail, l'indemnité de fin de contrat n'est pas due pour un emploi à caractère saisonnier.</p>
  <h2>Article ${n++} – Reconduction</h2>
  <p>${_Il(c)} bénéficiera, le cas échéant, du droit à la reconduction de son contrat pour la saison suivante dans les conditions prévues par l'article L.1244-2 et suivants du Code du travail et par la convention collective HCR. L'employeur l'informera, par tout moyen permettant de conférer date certaine, des conditions de reconduction.</p>
  <h2>Article ${n++} – Rupture anticipée</h2>
  <p>En dehors de la période d'essai, le contrat ne pourra être rompu avant son terme qu'en cas d'accord des parties, de faute grave, de force majeure, d'inaptitude constatée par le médecin du travail ou à l'initiative ${_du(c)} qui justifie d'une embauche en contrat à durée indéterminée (article L.1243-1 et suivants du Code du travail).</p>`;
  if (c.mineur) h += _clausesMineur(D, n++);
  h += _commun_fin(D, n);
  return h + _signatures(D);
}

// =====================================================================
// EXTRA — CDD D'USAGE
// =====================================================================
function contratExtra(D) {
  const c = D.c, v = D.v, E = D.E;
  const missions = (v.missions || []).filter(m => m.date);
  let n = 1, h = _entete(D, "CONTRAT DE TRAVAIL D'EXTRA", "Contrat à durée déterminée d'usage — articles L.1242-2 3°, D.1242-1 du Code du travail et article 14 de la convention collective HCR") + _parties(D);
  h += `<h2>Article ${n++} – Objet et motif</h2>
  <p>${_Il(c)} est engagé(e) en qualité d'<b>extra</b>, par contrat à durée déterminée d'usage, le secteur de l'hôtellerie et de la restauration faisant partie des secteurs dans lesquels il est d'usage constant de ne pas recourir au contrat à durée indéterminée pour ce type d'emploi par nature temporaire (articles L.1242-2 3° et D.1242-1 du Code du travail ; article 14 de la convention collective HCR). Cet engagement correspond à un renfort ponctuel lié à l'affluence.</p>
  <h2>Article ${n++} – Dates et horaires de la mission</h2>
  <p>${_Il(c)} est engagé(e) pour la ou les vacation(s) suivante(s), chacune constituant une mission distincte :</p>
  <table><tr><th>Date</th><th>Horaires</th><th>Durée</th></tr>
  ${missions.length ? missions.map(m => `<tr><td>${_d(m.date)}</td><td>${_v(m.debut)} – ${_v(m.fin)}</td><td>${_dureeMission(m)}</td></tr>`).join('') : '<tr><td>…………</td><td>…… – ……</td><td></td></tr>'}
  </table>
  <p>Le contrat prendra fin automatiquement à l'issue de la dernière vacation indiquée ci-dessus.</p>
  <h2>Article ${n++} – Fonctions et lieu de travail</h2>
  <p>${_Il(c)} occupera l'emploi d'<b>${_v(v.poste, 'équipier(ère) extra de restauration')}</b>, classé ${_v(v.niveau)} de la grille HCR, au restaurant « ${_v(E.enseigne)} », ${_v(E.lieu)}.</p>
  <h2>Article ${n++} – Rémunération</h2>
  <p>${_Il(c)} percevra un salaire horaire brut de <b>${_eur(v.taux)}</b> pour chaque heure de travail effectif, majoré le cas échéant des majorations conventionnelles. S'y ajoute une indemnité compensatrice de congés payés égale à 10 % de la rémunération brute. L'indemnité de fin de contrat n'est pas due (article L.1243-10 du Code du travail). ${_Il(c)} bénéficie des repas pris sur place pendant la vacation, évalués au minimum garanti (${_eur(D.P.mg)} par repas).</p>
  <h2>Article ${n++} – Absence de période d'essai</h2>
  <p>Compte tenu de la courte durée de l'engagement, le présent contrat ne comporte pas de période d'essai.</p>`;
  if (c.mineur) h += _clausesMineur(D, n++);
  h += _commun_fin(D, n);
  return h + _signatures(D);
}
function _dureeMission(m) {
  if (!m.debut || !m.fin) return '';
  const [h1, m1] = m.debut.split(':').map(Number), [h2, m2] = m.fin.split(':').map(Number);
  let min = (h2 * 60 + m2) - (h1 * 60 + m1); if (min < 0) min += 1440;
  return Math.floor(min / 60) + ' h ' + String(min % 60).padStart(2, '0');
}

// =====================================================================
// CDI ANNUALISÉ
// =====================================================================
function contratCDIAnnualise(D) {
  const c = D.c, v = D.v, E = D.E;
  const moy = Number(v.heures) || 35;
  const annuel = v.heuresAnnuelles || Math.round(moy / 35 * 1607);
  const P = calculPaie(moy, v.taux);
  let n = 1, h = _entete(D, 'CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE', 'Avec aménagement du temps de travail sur l\'année — articles L.3121-41 et suivants du Code du travail') + _parties(D);
  h += `<h2>Article ${n++} – Engagement</h2>
  <p>${_Il(c)} est engagé(e) par contrat à durée indéterminée à compter du <b>${_d(v.debut)}</b>${v.heureDebut ? ' à ' + _e(v.heureDebut) : ''}, sous réserve des résultats de la période d'essai.</p>
  <h2>Article ${n++} – Période d'essai</h2>
  <p>Le contrat ne deviendra définitif qu'à l'issue d'une période d'essai de <b>${_v(v.essai)}</b>, pendant laquelle chacune des parties pourra y mettre fin dans le respect des délais de prévenance prévus par les articles L.1221-25 et L.1221-26 du Code du travail.</p>
  <h2>Article ${n++} – Fonctions et classification</h2>
  <p>${_Il(c)} occupera l'emploi d'<b>${_v(v.poste, 'équipier(ère) polyvalent(e) de restauration')}</b>, classé ${_v(v.niveau)} de la grille de classification de la convention collective HCR. Ses missions comprennent notamment la préparation et le service des plats et boissons (postes moules, frites, bar et salle), l'accueil des clients, l'ouverture et la fermeture de l'établissement, le nettoyage et la plonge selon un roulement, ainsi que la participation à la formation des équipiers saisonniers.</p>
  <h2>Article ${n++} – Lieu de travail</h2>
  <p>${_Il(c)} exercera ses fonctions au restaurant « ${_v(E.enseigne)} », ${_v(E.lieu)}.</p>
  <h2>Article ${n++} – Durée du travail aménagée sur l'année</h2>
  <p>Compte tenu du caractère saisonnier de l'activité du restaurant, la durée du travail est organisée sur une période de référence de douze mois, du ${_d(v.refDebut)} au ${_d(v.refFin)}, en application ${E.accordAnnualisation ? 'de ' + _e(E.accordAnnualisation) : 'de l\'accord collectif applicable'} et des articles L.3121-41 et suivants du Code du travail.</p>
  <p>La durée annuelle de travail est fixée à <b>${annuel} heures</b>, correspondant à une durée hebdomadaire moyenne de ${moy} heures. Les heures sont réparties selon un programme indicatif annuel remis ${_au(c)}, prévoyant des semaines hautes pendant la saison et des semaines basses ou non travaillées hors saison (notamment de novembre à février). Toute modification du programme ou des horaires sera communiquée au moins 7 jours à l'avance, sauf délai différent prévu par l'accord applicable.</p>
  <p>Les heures effectuées au-delà de la durée annuelle constituent des heures supplémentaires, décomptées en fin de période de référence et rémunérées ou récupérées conformément aux dispositions légales et conventionnelles. Un relevé des heures est tenu à jour et communiqué ${_au(c)}.</p>
  <h2>Article ${n++} – Rémunération lissée</h2>
  <p>La rémunération est <b>lissée</b> sur la base de la durée hebdomadaire moyenne de ${moy} heures, indépendamment des heures réellement effectuées chaque mois, soit une rémunération mensuelle brute de <b>${_eur(P.mensuel)}</b> sur la base d'un taux horaire brut de <b>${_eur(v.taux)}</b>${moy > 35 ? ', majorations conventionnelles des heures au-delà de 35 heures incluses' : ''}. En cas d'absence, de départ ou d'arrivée en cours de période, une régularisation sera effectuée selon les règles légales et conventionnelles.</p>
  <h2>Article ${n++} – Avantage en nature nourriture</h2><p>${_Il(c)} bénéficie des repas pris sur place pendant ses heures de présence, conformément à la convention collective HCR. Cet avantage en nature est évalué sur la base du minimum garanti (${_eur(D.P.mg)} par repas à la date du contrat).</p>
  <h2>Article ${n++} – Congés payés</h2>
  <p>${_Il(c)} bénéficie des congés payés légaux et conventionnels, soit 2,5 jours ouvrables par mois de travail effectif. Compte tenu de l'activité saisonnière, les congés seront pris en priorité pendant la période de fermeture de l'établissement, selon l'ordre des départs fixé par l'employeur.</p>
  <h2>Article ${n++} – Rupture du contrat</h2>
  <p>Après la période d'essai, chacune des parties pourra rompre le contrat dans les conditions prévues par la loi et la convention collective HCR, notamment en respectant le préavis applicable.</p>`;
  if (c.mineur) h += _clausesMineur(D, n++);
  h += _commun_fin(D, n);
  return h + _signatures(D);
}

// =====================================================================
// BON DE REMISE DE TENUE
// =====================================================================
function bonTenue(D) {
  const c = D.c, t = D.tenue || {}, E = D.E;
  const lignes = (t.articles || []).filter(a => Number(a.qte) > 0);
  return _entete(D, 'BON DE REMISE DE TENUE DE TRAVAIL', E.enseigne + ' — ' + E.raison) + `
  <p>Je soussigné(e) <b>${_v(c.prenom)} ${_v(c.nom)}</b>, reconnais avoir reçu le ${_d(t.date)} la tenue de travail suivante, fournie gratuitement par l'employeur :</p>
  <table><tr><th>Article</th><th>Taille</th><th>Quantité</th></tr>
  ${lignes.map(a => `<tr><td>${_e(a.nom)}</td><td>${_e(a.taille || '')}</td><td>${_e(a.qte)}</td></tr>`).join('') || '<tr><td colspan="3">…</td></tr>'}</table>
  <p>Je m'engage à porter cette tenue pendant le service, à en prendre soin et à la restituer en bon état à la fin de mon contrat. La tenue reste la propriété de l'employeur.</p>
  <p style="margin-top:16px">Fait à ${_v(E.villeSignature)}, le ${_d(t.date)}.</p>
  <table class="sign"><tr><td><b>Pour l'employeur</b><br>${_v(E.representant)}</td><td><b>${_Il(c)}</b><br>${_v(c.prenom)} ${_v(c.nom)}<br><span class="petit">Signature</span></td></tr></table></div></body></html>`;
}

// =====================================================================
// AUTORISATION PARENTALE (version admin)
// =====================================================================
function autorisationParentale(D) {
  const c = D.c, v = D.v, E = D.E;
  return _entete(D, 'AUTORISATION PARENTALE DE TRAVAIL', 'Salarié(e) mineur(e)') + `
  <p>Je soussigné(e) <b>${_v(c.parentNom)}</b>, agissant en qualité de ${_v(c.parentLien)} et représentant légal de <b>${_v(c.prenom)} ${_v(c.nom)}</b>, ${_ne(c)} le ${_d(c.naissance)} à ${_v(c.lieuNaissance)},</p>
  <p>l'autorise à conclure un contrat de travail (${_v(TYPES_CONTRAT[v.type] && TYPES_CONTRAT[v.type].court)}) avec la société ${_v(E.raison)}, enseigne « ${_v(E.enseigne)} », ${_v(E.lieu)}, en qualité de ${_v(v.poste, 'équipier(ère) de restauration')}, pour la période du ${_d(v.debut)} au ${_d(v.fin)}.</p>
  <p>Je reconnais avoir été informé(e) des conditions de travail applicables aux jeunes travailleurs. Je joins une copie de ma pièce d'identité.</p>
  <p style="margin-top:20px">Fait à ……………………, le ……………………</p>
  <p>Signature, précédée de la mention « Bon pour autorisation »</p></div></body></html>`;
}

function genererDocument(type, D) {
  if (type === 'cdd_saison') return contratCDDSaison(D);
  if (type === 'extra') return contratExtra(D);
  if (type === 'cdi_annualise') return contratCDIAnnualise(D);
  if (type === 'tenue') return bonTenue(D);
  if (type === 'autorisation') return autorisationParentale(D);
  return '<p>Type inconnu</p>';
}
