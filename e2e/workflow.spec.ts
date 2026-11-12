import { expect, test, type Page } from '@playwright/test';

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'ChangeMe!12345';

const RUN = Date.now().toString(36);
const doctor = {
  name: `Dr. Zephyr${RUN}`,
  specialization: 'Hepatology',
  hospital: `Harbor Clinic ${RUN}`,
  phone: '+8801712345678',
  email: `zephyr.${RUN}@example.com`,
};
const patient = { name: `Quinn Patient${RUN}`, phone: '01911223344', age: '37', condition: 'Fatty liver' };

async function statValue(page: Page, label: string): Promise<number> {
  const card = page.locator('section[aria-label="Summary"] > div', { hasText: label }).first();
  await expect(card).toBeVisible();
  await expect(card.locator('p.tabular')).toHaveText(/^\d+(\.\d+)?$/);
  return Number(await card.locator('p.tabular').innerText());
}

async function choose(page: Page, triggerId: string, optionName: string | RegExp) {
  await page.locator(`#${triggerId}`).click();
  await page.getByRole('option', { name: optionName, exact: typeof optionName === 'string' }).click();
}

test.describe.configure({ mode: 'serial' });

test('administrator completes the main workflow', async ({ page }) => {
  // 1. Log in (an unauthenticated visit is bounced to /login first).
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
  await page.locator('#email').fill(EMAIL);
  await page.locator('#password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // 2. Dashboard opens with real statistics.
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Good (morning|afternoon|evening)/);
  const doctorsBefore = await statValue(page, 'Total doctors');
  const patientsBefore = await statValue(page, 'Total patients');
  await expect(page.locator('svg.recharts-surface').first()).toBeVisible();

  // 3. Create a doctor.
  await page.getByRole('link', { name: 'Doctors', exact: true }).first().click();
  await expect(page).toHaveURL(/\/doctors$/);
  await page.getByRole('button', { name: 'Add doctor' }).first().click();
  const doctorDialog = page.getByRole('dialog', { name: 'Add doctor' });
  // client-side validation first
  await doctorDialog.getByRole('button', { name: 'Add doctor' }).click();
  await expect(doctorDialog.getByText('Full name is required')).toBeVisible();
  await doctorDialog.locator('#doctor-name').fill(doctor.name);
  await doctorDialog.locator('#doctor-specialization').fill(doctor.specialization);
  await doctorDialog.locator('#doctor-hospital').fill(doctor.hospital);
  await doctorDialog.locator('#doctor-phone').fill(doctor.phone);
  await doctorDialog.locator('#doctor-email').fill(doctor.email);
  await doctorDialog.getByRole('button', { name: 'Add doctor' }).click();
  await expect(page.getByText('Doctor added')).toBeVisible();
  await expect(doctorDialog).toBeHidden();

  // The list updated without a reload: find the new doctor with the (debounced) search box.
  await page.getByRole('searchbox', { name: 'Search doctors' }).fill(`zephyr${RUN}`);
  await expect(page).toHaveURL(new RegExp(`search=zephyr${RUN}`));
  const doctorRow = page.getByRole('row', { name: new RegExp(doctor.name) });
  await expect(doctorRow).toBeVisible();
  await expect(doctorRow).toContainText('Hepatology');

  // 4. Open the doctor's details.
  await doctorRow.getByRole('link', { name: doctor.name, exact: true }).click();
  await expect(page).toHaveURL(/\/doctors\/[a-f0-9]{24}$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(doctor.name);
  await expect(page.getByText('Total patients').locator('..')).toContainText('0');
  await expect(page.getByText('No patients yet')).toBeVisible();

  // 5. Add a patient from the doctor's page (doctor is pre-selected and locked).
  await page.getByRole('button', { name: 'Add patient' }).first().click();
  const addDialog = page.getByRole('dialog', { name: 'Add patient' });
  await expect(addDialog.locator('#patient-doctor')).toBeDisabled();
  await addDialog.locator('#patient-name').fill(patient.name);
  await addDialog.locator('#patient-phone').fill(patient.phone);
  await addDialog.locator('#patient-age').fill(patient.age);
  await choose(page, 'patient-gender', 'Female');
  await addDialog.locator('#patient-condition').fill(patient.condition);
  await addDialog.locator('#patient-notes').fill('Created by the e2e workflow');
  await addDialog.getByRole('button', { name: 'Add patient' }).click();
  await expect(page.getByText('Patient added').first()).toBeVisible();
  await expect(page.getByRole('row', { name: new RegExp(patient.name) })).toBeVisible();
  await expect(page.getByText('Total patients').locator('..')).toContainText('1'); // doctor stats refreshed

  // 6. Open the patients page.
  await page.getByRole('link', { name: 'Patients', exact: true }).first().click();
  await expect(page).toHaveURL(/\/patients$/);

  // 7. Search and filter patients.
  await page.getByRole('searchbox', { name: 'Search patients' }).fill(`patient${RUN}`);
  await expect(page.getByRole('row', { name: new RegExp(patient.name) })).toBeVisible();
  await expect(page.getByText(/1 patient match your criteria/)).toBeVisible();
  // Search by assigned doctor name finds the same patient.
  await page.getByRole('searchbox', { name: 'Search patients' }).fill(`zephyr${RUN}`);
  await expect(page.getByRole('row', { name: new RegExp(patient.name) })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search patients' }).fill(`patient${RUN}`);
  await page.getByRole('button', { name: /Filters/ }).click();
  await choose(page, 'filter-gender', 'Male');
  await expect(page.getByText('No patients match your search')).toBeVisible(); // filters combine with search
  await choose(page, 'filter-gender', 'Female');
  await expect(page.getByRole('row', { name: new RegExp(patient.name) })).toBeVisible();
  await page.getByRole('button', { name: 'Clear all filters' }).click();
  await expect(page).not.toHaveURL(/gender=/);

  // 8. Edit the patient.
  await page.getByRole('button', { name: `Edit ${patient.name}` }).click();
  const editDialog = page.getByRole('dialog', { name: 'Edit patient' });
  await expect(editDialog.locator('#patient-name')).toHaveValue(patient.name); // pre-populated
  await editDialog.locator('#patient-age').fill('41');
  await editDialog.locator('#patient-condition').fill('Cirrhosis');
  await editDialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Patient updated')).toBeVisible();
  const editedRow = page.getByRole('row', { name: new RegExp(patient.name) });
  await expect(editedRow).toContainText('Cirrhosis');
  await expect(editedRow).toContainText('41');

  // 9. Delete the patient (explicit confirmation required).
  await page.getByRole('button', { name: `Delete ${patient.name}` }).click();
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toContainText(patient.name);
  await confirm.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('row', { name: new RegExp(patient.name) })).toBeVisible(); // cancel keeps the record
  await page.getByRole('button', { name: `Delete ${patient.name}` }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete patient' }).click();
  await expect(page.getByText('Patient deleted')).toBeVisible();
  await expect(page.getByRole('row', { name: new RegExp(patient.name) })).toHaveCount(0);

  // 10. Dashboard statistics reflect the changes: +1 doctor, patients back to where they started.
  await page.getByRole('link', { name: 'Dashboard', exact: true }).first().click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect.poll(() => statValue(page, 'Total doctors')).toBe(doctorsBefore + 1);
  await expect.poll(() => statValue(page, 'Total patients')).toBe(patientsBefore);
  await expect(page.getByText(`Patient record for ${patient.name} deleted`)).toBeVisible(); // real activity entry

  // 11. Log out; protected pages are no longer reachable.
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/patients');
  await expect(page).toHaveURL(/\/login\?next=%2Fpatients/);
});
