import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Recipient } from "@/types/recipient";
import { MapPin, Gift } from "lucide-react";

interface RecipientCardProps {
  recipient: Recipient;
}

function formatAddress(recipient: Recipient): string {
  const parts = [
    recipient.address1,
    recipient.address2,
    [recipient.city, recipient.state, recipient.zip].filter(Boolean).join(", "),
    recipient.country,
  ].filter(Boolean);

  return parts.join("\n");
}

function getDisplayName(recipient: Recipient): string {
  // Use addressTo if available, otherwise fall back to basic name formatting
  if (recipient.addressTo) {
    return recipient.addressTo;
  }

  const primaryName = [recipient.title, recipient.firstName, recipient.lastName]
    .filter(Boolean)
    .join(" ");
  const partnerName = [
    recipient.partnerTitle,
    recipient.partnerFirst,
    recipient.partnerLast,
  ]
    .filter(Boolean)
    .join(" ");

  if (primaryName && partnerName) {
    return `${primaryName} & ${partnerName}`;
  }
  return primaryName || "Unnamed Recipient";
}

export function RecipientCard({ recipient }: RecipientCardProps) {
  const address = formatAddress(recipient);
  const displayName = getDisplayName(recipient);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{displayName}</CardTitle>
          {recipient.isApproved && (
            <Badge variant="default" className="bg-green-600">
              Approved
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex gap-2">
            <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <div className="text-sm">
              <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                Address
              </p>
              {address ? (
                <p className="whitespace-pre-line">{address}</p>
              ) : (
                <p className="text-muted-foreground italic">No address</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Gift className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <div className="text-sm">
              <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                Gift
              </p>
              {recipient.gift ? (
                <div>
                  <p>{recipient.gift}</p>
                  {recipient.giftValue && (
                    <p className="text-muted-foreground">
                      ${recipient.giftValue}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No gift recorded</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
