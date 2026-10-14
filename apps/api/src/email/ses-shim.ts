// SES-backed drop-in for the subset of the Resend client Comp uses
// (emails.send + batch.send). Enabled with EMAIL_PROVIDER=ses; region from
// SES_REGION (default us-east-1); credentials from the default AWS chain.
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

type Att = { filename: string; content: Buffer | string; contentType?: string };
type SendArgs = {
  from: string;
  to: string | string[];
  cc?: string | string[];
  replyTo?: string | string[];
  subject: string;
  html?: string;
  react?: unknown;
  headers?: Record<string, string>;
  scheduledAt?: string;
  attachments?: Att[];
};
type Result = { data: { id: string } | null; error: { message: string } | null };

const arr = (v?: string | string[]) => (v === undefined ? undefined : Array.isArray(v) ? v : [v]);

export function createSesResend() {
  const client = new SESv2Client({ region: process.env.SES_REGION || 'us-east-1' });

  async function sendOne(a: SendArgs): Promise<Result> {
    try {
      let html = a.html;
      if (!html && a.react) {
        const { render } = await import('@react-email/render');
        html = await render(a.react as any);
      }
      const out = await client.send(
        new SendEmailCommand({
          FromEmailAddress: a.from,
          Destination: { ToAddresses: arr(a.to), CcAddresses: arr(a.cc) },
          ReplyToAddresses: arr(a.replyTo),
          Content: {
            Simple: {
              Subject: { Data: a.subject, Charset: 'UTF-8' },
              Body: { Html: { Data: html ?? '', Charset: 'UTF-8' } },
              Headers: a.headers
                ? Object.entries(a.headers).map(([Name, Value]) => ({ Name, Value }))
                : undefined,
              Attachments: a.attachments?.map((x) => ({
                FileName: x.filename,
                ContentType: x.contentType,
                RawContent: typeof x.content === 'string' ? Buffer.from(x.content, 'base64') : x.content,
              })),
            },
          },
        }),
      );
      return { data: { id: out.MessageId ?? '' }, error: null };
    } catch (e) {
      return { data: null, error: { message: e instanceof Error ? e.message : String(e) } };
    }
  }

  return {
    emails: { send: (a: SendArgs) => sendOne(a) },
    batch: {
      send: async (list: SendArgs[], _opts?: unknown) => {
        const data: { id: string }[] = [];
        for (const a of list) {
          const r = await sendOne(a);
          if (r.error) return { data: null, error: r.error };
          data.push(r.data!);
        }
        return { data: { data }, error: null };
      },
    },
  };
}
