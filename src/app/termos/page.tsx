import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata = { title: "Termos de Uso - ResolveLabs" };

const SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "1. Aceitação dos Termos",
    items: [
      'Ao criar uma conta e utilizar as ferramentas do ResolveLabs, você (doravante "Usuário") concorda expressamente com estes Termos de Uso. Caso não concorde com qualquer condição aqui descrita, o uso da plataforma deve ser imediatamente interrompido.',
    ],
  },
  {
    title: "2. Natureza dos Serviços e Processamento Local (Client-Side)",
    items: [
      "O ResolveLabs fornece ferramentas utilitárias técnicas e financeiras (como conversão de PDF para OFX, reparo de XML, entre outros).",
      "2.1. Privacidade por Design: O processamento, conversão e leitura de arquivos sensíveis (extratos, planilhas, documentos) ocorre exclusivamente no navegador (browser) do Usuário. O ResolveLabs NÃO faz upload, NÃO processa em seus servidores e NÃO armazena os conteúdos dos arquivos processados por estas ferramentas.",
      "2.2. A segurança do ambiente local, incluindo a ausência de malwares no computador do Usuário que possam interceptar dados no navegador, é de exclusiva responsabilidade do Usuário.",
    ],
  },
  {
    title: "3. Isenção de Responsabilidade sobre Precisão de Dados",
    items: [
      "As ferramentas de conversão e extração de dados baseiam-se em padrões comuns de mercado (ex: layouts de PDFs bancários). Como instituições financeiras podem alterar a formatação de seus documentos sem aviso prévio, o ResolveLabs não garante 100% de precisão na extração dos dados.",
      "3.1. É obrigação exclusiva do Usuário (ou de seu departamento contábil/financeiro) conferir a integridade, os valores e a exatidão dos arquivos gerados (como .ofx ou .xml) antes de importá-los em sistemas ERP, contábeis ou governamentais.",
      "3.2. O ResolveLabs isenta-se de qualquer responsabilidade por multas, juros, atrasos, inconsistências contábeis ou prejuízos financeiros decorrentes do uso de arquivos gerados pela plataforma.",
    ],
  },
  {
    title: "4. Planos, Período de Teste (Trial) e Faturamento",
    items: [
      "4.1. Trial: O ResolveLabs pode oferecer um período de teste gratuito de 7 (sete) dias para novos usuários. O cancelamento pode ser feito a qualquer momento antes do término deste período sem cobranças.",
      "4.2. Assinatura Recorrente: Após o período de teste, o plano PRO será ativado automaticamente e o valor aplicável será cobrado mensalmente via cartão de crédito.",
      "4.3. Cancelamento: O Usuário pode cancelar a assinatura a qualquer momento através do painel de controle. O acesso ao plano PRO continuará ativo até o final do ciclo de faturamento atual. Não realizamos reembolsos ou estornos por frações de meses não utilizados.",
    ],
  },
  {
    title: "5. Uso Aceitável e Programa de Afiliados",
    items: [
      "5.1. O Usuário compromete-se a não utilizar as ferramentas do ResolveLabs para processar material ilícito ou contornar medidas de segurança governamentais.",
      '5.2. Afiliados: Ao participar do programa "Indique e Ganhe", o Usuário não poderá utilizar práticas de spam, engenharia social maliciosa ou criar contas falsas (auto-indicação) para obter vantagens. A violação desta regra resultará no banimento imediato da conta e perda das recompensas acumuladas.',
    ],
  },
  {
    title: "6. Coleta de Dados Cadastrais",
    items: [
      "Para a prestação do serviço e suporte técnico, armazenamos apenas os dados de conta do Usuário: E-mail, Número de Celular e histórico de pagamentos e acessos. Estes dados não são vendidos ou compartilhados com terceiros para fins de marketing.",
    ],
  },
  {
    title: "7. Modificações dos Termos e da Plataforma",
    items: [
      "O ResolveLabs reserva-se o direito de modificar, suspender ou descontinuar qualquer ferramenta da plataforma a qualquer momento. Estes Termos podem ser atualizados periodicamente, e o uso contínuo da plataforma após as alterações constitui aceitação dos novos termos.",
    ],
  },
  {
    title: "8. Foro",
    items: [
      "Fica eleito o foro da comarca da sede do desenvolvedor do ResolveLabs no Brasil, para dirimir quaisquer dúvidas ou controvérsias oriundas destes Termos de Uso, renunciando a qualquer outro por mais privilegiado que seja.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <Header />
      <Breadcrumbs items={["Home", "Termos de Uso"]} />
      <main className="page-container max-w-3xl flex-1 pb-20">
        <h1 className="mb-8 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
          Termos de Uso e Condições de Serviço
        </h1>
        <div className="card space-y-8 p-6 sm:p-8">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="mb-3 text-lg font-semibold text-stone-900">{s.title}</h2>
              <div className="space-y-3 text-sm leading-relaxed text-stone-800">
                {s.items.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
