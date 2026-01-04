import { Building2, User, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Invoice } from '@/types/invoice';

interface ClientProjectCardProps {
  invoice: Invoice;
}

export function ClientProjectCard({ invoice }: ClientProjectCardProps) {
  const { client, project } = invoice;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Client & Project</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Client Block */}
        {client && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{client.name}</span>
            </div>
            {client.contactName && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{client.contactName}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-3 text-sm">
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {client.email}
                </a>
              )}
              {client.phone && (
                <a
                  href={`tel:${client.phone}`}
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {client.phone}
                </a>
              )}
            </div>
            {client.address && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>{client.address}</span>
              </div>
            )}
          </div>
        )}

        {/* Project Block */}
        {project && (
          <>
            {client && <div className="border-t" />}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Project</div>
              <div className="flex items-center justify-between">
                <span className="font-medium">{project.name}</span>
                <Button variant="outline" size="sm" className="gap-1.5">
                  Open Project
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
