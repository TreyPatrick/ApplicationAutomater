import { NextResponse } from "next/server";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { Resume, type ResumeT } from "@/lib/schemas";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

const s = StyleSheet.create({
  page: { paddingVertical: 30, paddingHorizontal: 40, fontFamily: "Times-Roman", fontSize: 10, lineHeight: 1.25, color: "#111" },
  name: { fontFamily: "Times-Bold", fontSize: 18, textAlign: "center" },
  contact: { textAlign: "center", fontSize: 9.5, marginTop: 2, marginBottom: 6 },
  h: { fontFamily: "Times-Bold", fontSize: 10.5, borderBottomWidth: 0.8, borderBottomColor: "#111", marginTop: 6, marginBottom: 3, paddingBottom: 1 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  b: { fontFamily: "Times-Bold" },
  i: { fontFamily: "Times-Italic" },
  bullet: { flexDirection: "row", paddingLeft: 8 },
  dot: { width: 10 },
  bt: { flex: 1 },
});

function ResumePdf({ r }: { r: ResumeT }) {
  return (
    <Document title={`${r.name} Resume`} author={r.name}>
      <Page size="LETTER" style={s.page}>
        <Text style={s.name}>{r.name}</Text>
        <Text style={s.contact}>{r.contact.join("  |  ")}</Text>
        {r.education.length > 0 && <Text style={s.h}>EDUCATION</Text>}
        {r.education.map((e, i) => (
          <View key={i} wrap={false}>
            <View style={s.row}><Text style={s.b}>{e.school}</Text><Text style={s.b}>{e.location}</Text></View>
            <View style={s.row}><Text style={s.i}>{e.degree}</Text><Text style={s.i}>{e.dates}</Text></View>
            {e.details.map((d, j) => <Text key={j}>{d}</Text>)}
          </View>
        ))}
        {r.sections.map((sec, i) => (
          <View key={i}>
            <Text style={s.h}>{sec.title.toUpperCase()}</Text>
            {sec.entries.map((en, j) => (
              <View key={j} wrap={false} style={{ marginBottom: 2 }}>
                <View style={s.row}><Text style={s.b}>{en.org}</Text><Text style={s.b}>{en.location}</Text></View>
                {(en.role || en.dates) && (
                  <View style={s.row}><Text style={s.i}>{en.role}</Text><Text style={s.i}>{en.dates}</Text></View>
                )}
                {en.bullets.map((bt, k) => (
                  <View key={k} style={s.bullet}><Text style={s.dot}>•</Text><Text style={s.bt}>{bt}</Text></View>
                ))}
              </View>
            ))}
          </View>
        ))}
        {r.skills.length > 0 && (
          <View>
            <Text style={s.h}>SKILLS</Text>
            <Text>{r.skills.join("  •  ")}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

/** POST { resume, filename? } → PDF file. */
export async function POST(req: Request) {
  const { data: { user } } = await supabaseServer().auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  try {
    const body = await req.json();
    const r = Resume.parse(body.resume);
    const buf = await renderToBuffer(<ResumePdf r={r} />);
    const filename = String(body.filename || `${r.name.replace(/\s+/g, "_")}_Resume.pdf`).replace(/[^\w.\-]/g, "_");
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"` },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Couldn't build the PDF." }, { status: 500 });
  }
}
