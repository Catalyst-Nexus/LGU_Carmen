import { FileText } from 'lucide-react';

export default function OfficialReceiptGeneration() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-5 h-5 text-success" />
        <h2 className="text-lg font-semibold text-foreground">OR Generation</h2>
      </div>
      <p className="text-sm text-muted">
        OR generation is now handled in the two-tab page at Official Receipt Management.
      </p>
    </div>
  );
}
