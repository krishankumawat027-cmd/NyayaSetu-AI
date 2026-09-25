import { AuthenticatedShell } from '@/components/authenticated-shell';
import { DocumentUploader } from '@/components/document-uploader';
export default function DocumentsPage(){return <AuthenticatedShell><div className="mx-auto max-w-6xl space-y-8 p-5 md:p-10"><div><p className="eyebrow">DOCUMENT ANALYZER</p><h1 className="serif mt-2 text-5xl text-navy">Make a document easier to read.</h1><p className="mt-3 text-sm text-slate-500">Upload a supported file to private storage. Document extraction and AI analysis are not available yet.</p></div><DocumentUploader/></div></AuthenticatedShell>}
