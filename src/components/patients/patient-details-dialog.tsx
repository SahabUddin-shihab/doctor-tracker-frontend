'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { capitalize, formatDateTime } from '@/lib/utils';
import type { Patient } from '@/types';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 break-words">{children}</dd>
    </div>
  );
}

export function PatientDetailsDialog({ patient, onOpenChange }: { patient: Patient | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={patient !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {patient ? (
          <>
            <DialogHeader>
              <DialogTitle>{patient.name}</DialogTitle>
              <DialogDescription>{patient.condition}</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <dl className="divide-y">
                <Row label="Phone">
                  <span className="tabular">{patient.phone}</span>
                </Row>
                <Row label="Email">{patient.email ?? <span className="text-muted-foreground">Not provided</span>}</Row>
                <Row label="Age">
                  <span className="tabular">{patient.age}</span>
                </Row>
                <Row label="Gender">{capitalize(patient.gender)}</Row>
                <Row label="Doctor">
                  {patient.doctor ? (
                    <Link href={`/doctors/${patient.doctor.id}`} className="text-primary hover:underline">
                      {patient.doctor.name}
                      <span className="text-muted-foreground"> · {patient.doctor.specialization}</span>
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </Row>
                <Row label="Notes">{patient.notes ? <span className="whitespace-pre-wrap">{patient.notes}</span> : <span className="text-muted-foreground">None</span>}</Row>
                <Row label="Registered">
                  <span className="tabular">{formatDateTime(patient.createdAt)}</span>
                </Row>
                <Row label="Last updated">
                  <span className="tabular">{formatDateTime(patient.updatedAt)}</span>
                </Row>
              </dl>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
