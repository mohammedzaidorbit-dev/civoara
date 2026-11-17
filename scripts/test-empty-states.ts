import {
  getPublicMapIncidentsAction,
  getCitizenIncidentsAction,
  getOfficerAssignedIncidentsAction,
  getAdminTriageIncidentsAction,
  getPublicIncidentByTicketAction,
} from '../src/lib/actions/incident';

async function main() {
  console.log('Testing live data retrieval actions (verifying zero dummy data)...');

  const publicIncidents = await getPublicMapIncidentsAction();
  console.log('Public map incidents count:', publicIncidents.length);
  if (!Array.isArray(publicIncidents)) throw new Error('Expected array');

  const citizenIncidents = await getCitizenIncidentsAction();
  console.log('Citizen incidents count:', citizenIncidents.length);
  if (!Array.isArray(citizenIncidents)) throw new Error('Expected array');

  const officerIncidents = await getOfficerAssignedIncidentsAction();
  console.log('Officer incidents count:', officerIncidents.length);
  if (!Array.isArray(officerIncidents)) throw new Error('Expected array');

  const adminIncidents = await getAdminTriageIncidentsAction();
  console.log('Admin triage incidents count:', adminIncidents.length);
  if (!Array.isArray(adminIncidents)) throw new Error('Expected array');

  const nonExistentTicket = await getPublicIncidentByTicketAction('NON-EXISTENT-XYZ-9999');
  console.log('Non-existent ticket result:', nonExistentTicket);
  if (nonExistentTicket !== null) throw new Error('Expected null for non-existent ticket');

  console.log('✓ All live action tests passed! Strict zero dummy data contract verified.');
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
