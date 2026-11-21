'use client';

import { FileText, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Section } from '@/components/shared/section';
import { Button } from '@/components/ui/button';
import { JameyaDetail, JameyaMember } from '@/lib/api/jameyas';
import { JameyaMemberStatementPdf } from './jameya-member-statement-pdf';
import { useJameyaMemberStatement } from './use-jameya-member-statement';
import { useJameyaPdfShare } from './use-jameya-pdf-share';

function StatementButton({ jameya, member }: { jameya: JameyaDetail; member: JameyaMember }) {
  const t = useTranslations('jameyas.statement');
  const { buildStatement } = useJameyaMemberStatement(jameya);
  const { share, isGenerating, isReady } = useJameyaPdfShare();

  function handleShare() {
    const content = buildStatement(member);
    void share({
      render: (tenant, locale) => <JameyaMemberStatementPdf locale={locale} content={content} tenant={tenant} />,
      fileName: `${jameya.name} ${member.name}`,
      fallbackFileName: 'statement',
      title: content.title,
    });
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={!isReady} onClick={handleShare}>
      {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
      {t('button')}
    </Button>
  );
}

export function JameyaMembersStatements({
  jameya,
  onOpenMember,
}: {
  jameya: JameyaDetail;
  onOpenMember: (customerId: string) => void;
}) {
  const t = useTranslations('jameyas');

  return (
    <Section title={t('detail.membersTitle')}>
      <ul className="divide-y divide-border">
        {jameya.members.map((member) => (
          <li key={member.customerId} className="flex items-center gap-3 py-2">
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onOpenMember(member.customerId)}
                className="block truncate text-start text-sm font-medium hover:underline"
              >
                {member.name}
              </button>
              <p className="text-xs text-muted-foreground">
                {member.turnSequences.length > 1
                  ? t('customerSection.turnsValue', {
                      sequences: member.turnSequences.join(t('customerSection.sequenceSeparator')),
                    })
                  : t('customerSection.turnValue', { sequence: member.turnSequences[0] })}
              </p>
            </div>
            <StatementButton jameya={jameya} member={member} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
