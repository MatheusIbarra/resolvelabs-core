// Conteúdo das landings de SEO (uma por intenção de busca). Só o servidor usa este domínio (não vai ao bundle do cliente).
// Placeholders: {freeLimit}, {price}, {trialDays}, {bank}. A estrutura (slug, tipo, relacionadas) fica em lib/seo-tools.ts.
import type { Shape } from "../types";

export interface ToolText {
  shortName: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  features: string[];
  faq: { q: string; a: string }[];
  keywords: string[];
  privacy?: string;
  steps?: { title: string; items: string[] };
  cta?: { label: string; note: string };
}

const en = {
  schema: { operatingSystem: "Web (browser)", home: "Home" },
  offers: {
    free: { name: "Free", description: "Free to use, no sign-up." },
    convFree: { name: "Free", description: "{freeLimit} free conversions." },
    convPro: { name: "PRO", description: "Unlimited conversions. {trialDays} days free to start." },
    pro: { name: "PRO", description: "{trialDays} days free to start." },
  },
  privacy: "The file is processed in your browser and never goes through our servers.",
  bankStepsNote: "Menu names change depending on the app or internet banking version.",
  bank: {
    shortName: "{bank} statement to OFX",
    title: "Convert {bank} PDF statement to OFX online",
    description:
      "Turn your {bank} PDF statement into an OFX file for bank reconciliation. Conversion in the browser, without sending the PDF to our servers. {freeLimit} free conversions.",
    h1: "Convert {bank} statement from PDF to OFX",
    intro: "Downloaded your {bank} statement as PDF and need the OFX for your accounting system? Convert it here. {privacy}",
    features: [
      "Reads the {bank} PDF statement layout",
      "Generates OFX ready to import into accounting systems and ERPs",
      "100% in-browser processing: the PDF never goes through our servers",
      "{freeLimit} free conversions; after that, the PRO plan",
    ],
    stepsTitle: "How to get the OFX from your {bank} statement",
    faq: {
      free: {
        q: "Can I convert my {bank} statement from PDF to OFX for free?",
        a: "Yes, you get {freeLimit} free conversions. After that, the PRO plan ({price}, with {trialDays} days free at the start) unlocks unlimited conversions.",
      },
      privacy: {
        q: "Is my {bank} statement PDF sent to any server?",
        a: "No. Reading the PDF and generating the OFX happen in your browser. We only record your account's usage counter, never the file content.",
      },
      diff: {
        q: "What's the difference between a PDF and an OFX statement?",
        a: "A PDF is only visual. OFX carries the date, amount, description and type of each entry in a structured way, so accounting systems can import and reconcile it automatically.",
      },
    },
    keywords: ["{bank} ofx statement", "convert {bank} pdf statement to ofx", "how to download {bank} ofx statement"],
    cta: {
      label: "Convert my statement now",
      note: "Create a free account or sign in to convert. The PDF stays in your browser.",
    },
    items: {
      nubank: {
        steps: [
          "In the Nubank app, open your account (NuConta) and look for the option to request or export the statement.",
          "Choose the period and, if the app offers it, the OFX format. If only PDF is available, download the PDF.",
          "With the PDF in hand, use the ResolveLabs converter to generate the OFX in your browser.",
          "Import the OFX into your accounting or financial system.",
        ],
        extra: {
          q: "How do I download my Nubank statement as OFX?",
          a: "In the app, open NuConta and use the option to request the statement, choosing the period and format. When OFX isn't available for the period you need, download the PDF and convert it here. {note}",
        },
      },
      itau: {
        steps: [
          "In Itaú's internet banking or app, open the account statement screen.",
          "Select the period and look for the option to save the statement in other formats (OFX). If only PDF is available, download the PDF.",
          "Convert the PDF in ResolveLabs to generate the OFX right in your browser.",
          "Import the OFX into your accounting system.",
        ],
        extra: {
          q: "How do I get my Itaú statement as OFX?",
          a: "On the internet banking statement screen, look for the option to save or export in other formats and choose OFX. If the period or account doesn't offer OFX, download the PDF and convert it here. {note}",
        },
      },
      bradesco: {
        steps: [
          "In Bradesco's internet banking or app, open the account statement.",
          "Set the period and look for the option to export or save the statement as OFX. If only PDF is available, download the PDF.",
          "Convert the PDF in ResolveLabs to generate the OFX right in your browser.",
          "Import the OFX into your accounting system.",
        ],
        extra: {
          q: "How do I download my Bradesco statement as OFX?",
          a: "On the internet banking or app statement, use the option to export or save and choose OFX. When there's no OFX for the period, download the PDF and convert it here. {note}",
        },
      },
    },
  },
  tools: {
    "visualizador-ofx": {
      shortName: "OFX viewer",
      title: "Free online OFX viewer: open an OFX file",
      description:
        "Open and view any OFX file online: see the balance, account and every statement entry. Free, no sign-up and without sending the file to servers.",
      h1: "Online OFX viewer",
      intro:
        "Open an OFX file and see the account, balance and every statement entry in seconds. Your OFX file never goes through our servers: processing is 100% in the browser.",
      features: [
        "Opens OFX and QFX files from any bank",
        "Shows account, period, balance and all entries in a table",
        "Works on computer and phone, with no software to install",
        "100% in-browser processing: the file never goes through our servers",
        "Free and no sign-up",
      ],
      faq: [
        {
          q: "What is an OFX file?",
          a: "OFX (Open Financial Exchange) is the format banks use to export statements in a structured way. It carries the date, amount, description and type of each entry, and it is the standard for importing statements into accounting and bank reconciliation systems.",
        },
        {
          q: "How do I open an OFX file?",
          a: "Choose the file in the box above or drag it onto it. ResolveLabs reads the OFX in your browser and shows the statement as a table, with nothing to install and without uploading the file.",
        },
        {
          q: "Is my OFX file sent to any server?",
          a: "No. Reading happens entirely in your browser and the file never goes through our servers.",
        },
        {
          q: "Can I open OFX on my phone?",
          a: "Yes. The page works in your phone's browser: tap choose file and select the downloaded OFX.",
        },
        {
          q: "How do I open OFX in Excel or convert it to CSV?",
          a: "This viewer shows the OFX content and lets you copy the data, but it doesn't generate a spreadsheet. To see the statement in columns, open the OFX here and copy the entries into your spreadsheet.",
        },
        {
          q: "What's the difference between OFX and CSV?",
          a: "OFX follows a standard with defined fields (date, amount, transaction ID), which makes automatic import easier. CSV is a plain table and each bank builds the columns its own way.",
        },
        {
          q: "Does the viewer change my OFX file?",
          a: "No. It only reads and displays the content; the original file is not modified.",
        },
      ],
      keywords: ["open ofx file", "view ofx online", "read ofx file", "what is an ofx file", "open ofx on phone", "ofx to excel", "ofx or csv"],
    },
    "visualizador-xml": {
      shortName: "XML viewer",
      title: "Free online XML viewer: open and see the XML structure",
      description:
        "Open XML files online and browse the structure as a tree, including Brazilian NF-e XML. Free, no sign-up and without sending the file to servers.",
      h1: "Online XML viewer",
      intro:
        "Open an XML file and browse the structure as a tree, with tags, attributes and values. It works for viewing the content of an NF-e XML, a product feed or any other file. The file never goes through our servers.",
      features: [
        "Shows the XML as a tree, with tags, attributes and values",
        "Useful for checking the content of NF-e, NFC-e and CT-e XML",
        "Flags malformed XML with the error message",
        "Copies a node or the whole formatted XML",
        "100% in-browser processing, without sending the file",
      ],
      faq: [
        {
          q: "How do I open an XML file?",
          a: "Choose the file in the box above or drag it onto it. The XML is read in your browser and shown as a tree, with nothing to install.",
        },
        {
          q: "Can I see the content of an NF-e XML?",
          a: "Yes, you can browse every field of the NF-e XML (issuer, recipient, items, taxes, access key). This tool shows the structure and data of the XML; it doesn't generate the DANFE PDF.",
        },
        {
          q: "Is the XML sent to any server?",
          a: "No. Reading happens in your browser and the file never goes through our servers.",
        },
        {
          q: "How do I know if my XML is malformed?",
          a: "When you open it, the tool tries to parse the XML. If there's an unclosed tag or an invalid character, it shows the error found. It checks that the XML is well formed; it doesn't validate against a schema (XSD).",
        },
        {
          q: "Does it work with large XML?",
          a: "Large text files are loaded into the browser's memory, with a limit of 60 MB. Above that, the tool warns you.",
        },
      ],
      keywords: ["view xml online", "open xml file", "see nfe xml structure", "view nfe xml online", "validate xml online"],
    },
    "visualizador-planilhas": {
      shortName: "XLSX and CSV viewer",
      title: "Open XLSX and CSV online for free: spreadsheet viewer",
      description:
        "Open XLSX, XLS, CSV and ODS spreadsheets online, without Excel. See sheets and cells right in the browser, free and without sending the file to servers.",
      h1: "Open XLSX and CSV online",
      intro:
        "See the content of XLSX, XLS, CSV, TSV and ODS spreadsheets without needing Excel. The file is opened in your browser and never goes through our servers.",
      features: [
        "Opens XLSX, XLSM, XLS, CSV, TSV and ODS",
        "Switches between sheets and scrolls large spreadsheets",
        "Copies individual cells",
        "Detects the real file type from its content, not just the extension",
        "100% in-browser processing, without sending the file",
      ],
      faq: [
        {
          q: "How do I open an XLSX file without Excel?",
          a: "Choose the file in the box above or drag it onto it. The spreadsheet is read in the browser and shown with its sheets and cells, with no software to install.",
        },
        {
          q: "How do I open a CSV online?",
          a: "Use the same box: the CSV opens as a table. This avoids the problem of merged columns when Excel guesses the wrong separator.",
        },
        {
          q: "Is my file sent to any server?",
          a: "No. The spreadsheet is read in your browser and never goes through our servers.",
        },
        {
          q: "Does this viewer edit spreadsheets?",
          a: "No. It's for reading and copying the content. The original file is not modified.",
        },
      ],
      keywords: ["open xlsx online", "open csv online", "view csv online", "open spreadsheet without excel"],
    },
    "visualizador-json": {
      shortName: "JSON viewer",
      title: "Free online JSON viewer: open a JSON file",
      description:
        "Open and view JSON files as a formatted, readable tree. Free, no sign-up and without sending the file to servers.",
      h1: "Online JSON viewer",
      intro:
        "Open a JSON file and browse the structure as a tree, with objects, lists and values. The file is read in your browser and never goes through our servers.",
      features: [
        "Shows the JSON as a tree, expanding and collapsing levels",
        "Flags invalid JSON with the error message",
        "Copies a node or the whole formatted JSON",
        "100% in-browser processing, without sending the file",
      ],
      faq: [
        {
          q: "How do I open a JSON file?",
          a: "Choose the file in the box above or drag it onto it. The JSON is read in the browser and shown as a tree.",
        },
        {
          q: "Is the JSON sent to any server?",
          a: "No. Reading happens in your browser and the file never goes through our servers.",
        },
        {
          q: "How do I know if a JSON is valid?",
          a: "When you open it, the tool tries to parse the content. If there's an extra comma, missing quotes or another syntax error, it shows the error message.",
        },
      ],
      keywords: ["view json online", "open json file", "open json online"],
    },
    "conversor-pdf-para-ofx": {
      shortName: "PDF to OFX converter",
      title: "Convert PDF to OFX online: bank statement for reconciliation",
      description:
        "Convert a PDF bank statement to OFX right in your browser, without sending the PDF to our servers. {freeLimit} free conversions, then the PRO plan.",
      h1: "Convert PDF statement to OFX",
      intro:
        "Turn the PDF bank statement into an OFX file ready to import into your accounting system. Your PDF never goes through our servers: processing is 100% in the browser.",
      features: [
        "Converts PDF statements from Nubank, Inter, Itaú and Bradesco",
        "Generates OFX ready to import into accounting systems and ERPs",
        "100% in-browser processing: the PDF never goes through our servers",
        "{freeLimit} free conversions; after that, the PRO plan with unlimited conversions",
      ],
      faq: [
        {
          q: "How do I convert PDF to OFX?",
          a: "Sign in to your free account, open the converter and upload the PDF statement. The file is read in your browser, the entries are identified and the OFX is generated for you to download.",
        },
        {
          q: "Can I convert PDF to OFX for free?",
          a: "Yes. You get {freeLimit} free conversions. After that, the PRO plan ({price}, with {trialDays} days free at the start) unlocks unlimited conversions.",
        },
        {
          q: "Is my PDF sent to any server?",
          a: "No. Reading the PDF and generating the OFX happen in your browser. We only record your account's usage counter, never the file content.",
        },
        {
          q: "Which banks are supported?",
          a: "Nubank, Inter, Itaú and Bradesco. If your bank isn't on the list, open a ticket with support and send the statement layout, without sensitive data.",
        },
        {
          q: "What's the difference between a PDF and an OFX statement?",
          a: "A PDF is only visual. OFX carries the date, amount, description and type of each entry in a structured way, so accounting systems can import and reconcile it automatically.",
        },
        {
          q: "How do I check the generated OFX?",
          a: "Open the file in the ResolveLabs OFX viewer to check the balance and entries before importing it into your system.",
        },
      ],
      keywords: ["convert pdf to ofx", "free pdf to ofx", "convert pdf statement to ofx", "pdf statement to ofx online"],
      cta: {
        label: "Open the converter",
        note: "Create a free account or sign in to convert. The PDF stays in your browser.",
      },
    },
    "planilha-para-ofx": {
      shortName: "Spreadsheet to OFX converter",
      title: "Convert a spreadsheet (CSV or Excel) to OFX online for free",
      description:
        "Convert CSV, XLSX or XLS to an OFX file for bank reconciliation: choose the date, description and amount columns and download the OFX. Free, in the browser, without sending the spreadsheet.",
      h1: "Convert spreadsheet to OFX",
      intro:
        "Have the statement as CSV or Excel and need the OFX for your accounting system? Upload the spreadsheet, tell us which columns are date, description and amount, and download the file. Your spreadsheet never goes through our servers: processing is 100% in the browser.",
      features: [
        "Reads CSV, XLSX, XLS and ODS, including Brazilian CSV (semicolon separator, 1.234,56 numbers)",
        "Column mapping: you choose which is the date, the description and the amount",
        "Accepts a signed amount column or separate debit and credit columns",
        "Preview, total inflows and outflows and a list of skipped rows before downloading",
        "100% in-browser processing: the spreadsheet never goes through our servers",
        "Free and no sign-up",
      ],
      faq: [
        {
          q: "How do I convert a spreadsheet to OFX?",
          a: "Upload the CSV or Excel file, choose from the lists which column is the date, the description and the amount, check the preview and click generate. The OFX is created in your browser and the download starts right away.",
        },
        {
          q: "Which spreadsheet formats are supported?",
          a: "CSV, TSV, XLSX, XLSM, XLS and ODS, up to 20 MB and 50 thousand rows. In CSV, semicolon, comma and tab are detected automatically, as is UTF-8 or Windows-1252 encoding.",
        },
        {
          q: "How should the spreadsheet be organized?",
          a: "One row per entry, with at least a date column and an amount column. The description is optional but helps reconciliation. If the first row is the header, the tool suggests columns by name (Date, Description, Amount).",
        },
        {
          q: "Which date and amount formats work?",
          a: "Dates like 31/01/2026, 31/01/26, 2026-01-31 and Excel dates. Amounts like 1.234,56, 1,234.56, R$ 1.234,56, (1.234,56) for negative and with a D or C suffix. The number format is detected from the whole column, and you can choose it manually.",
        },
        {
          q: "My spreadsheet has debit and credit in separate columns. Does it work?",
          a: "Yes. Switch the amount option to separate columns and pick the debit column (becomes an outflow) and the credit column (becomes an inflow).",
        },
        {
          q: "What happens to invalid rows?",
          a: "Blank rows are skipped silently. Rows with an invalid date or amount are also left out of the OFX, and the tool shows how many there were and the numbers of the first ones, so you can fix the spreadsheet if you want.",
        },
        {
          q: "Does the generated OFX include the account balance?",
          a: "No. The file carries the entries, the period and the account data you provide. Check the import in your accounting system before using it in production.",
        },
        {
          q: "Is my spreadsheet sent to any server?",
          a: "No. Reading the spreadsheet and generating the OFX happen in your browser and the file never goes through our servers.",
        },
      ],
      keywords: ["convert spreadsheet to ofx", "csv to ofx", "excel to ofx", "xlsx to ofx", "convert csv to ofx online free"],
      privacy:
        "The spreadsheet is read and converted in your browser and never goes through our servers. You can use client statements without exposing their content to third parties.",
    },
    "gerador-senhas": {
      shortName: "Password generator",
      title: "Free online strong random password generator",
      description:
        "Generate strong, random passwords from 8 to 64 characters, with letters, numbers and symbols. Free, no sign-up, and the password never leaves your browser.",
      h1: "Strong password generator",
      intro:
        "Create a strong random password in one click: choose the length and the character types. The password is generated in your browser and is not sent or stored anywhere.",
      features: [
        "Length from 8 to 64 characters, with uppercase, lowercase, numbers and symbols",
        "Secure browser randomness (crypto.getRandomValues), no Math.random",
        "Option to avoid look-alike characters, like O and 0 or I and l",
        "Strength estimate in bits of entropy",
        "The password is not sent or stored: it stays only on your screen",
        "Free and no sign-up",
      ],
      faq: [
        {
          q: "How do I generate a strong random password?",
          a: "Adjust the length, tick the character types and copy the password. For important accounts, use 16 characters or more, with all four types, and a different password for each service.",
        },
        {
          q: "Is the generated password sent or saved to any server?",
          a: "No. It's created in your browser and disappears when you close or reload the page. No password value is sent, and we only count that the tool was used, without the content.",
        },
        {
          q: "Is this password really random?",
          a: "Yes. The generator uses the browser's cryptographically secure random number generation and picks each character without bias. We guarantee at least one character of each ticked type.",
        },
        {
          q: "What's the ideal password length?",
          a: "The longer, the stronger. For most accounts, 16 random characters are already hard to crack. The strength estimate shows entropy in bits: above 80 bits is considered very strong.",
        },
        {
          q: "How do I keep track of so many passwords?",
          a: "Use a password manager. It stores each unique password encrypted and fills in the forms for you.",
        },
        {
          q: "Can I use it for my Wi-Fi password?",
          a: "Yes. To type it easily on a phone, untick the symbols, tick the option to avoid look-alike characters, and use a longer length to compensate.",
        },
      ],
      keywords: ["password generator", "strong password generator", "generate random password", "free online password generator"],
      privacy:
        "The password is generated in your browser with secure random generation. It is not sent, saved or logged: it disappears when you close the page.",
    },
    "gerador-qrcode": {
      shortName: "QR code generator",
      title: "Free QR code generator: create and download as PNG",
      description:
        "Create a QR code for a link or text instantly and download it as a high-resolution PNG. Free, no sign-up, no expiry, and the content never leaves your browser.",
      h1: "Free QR code generator",
      intro:
        "Type a link or text and the QR code appears instantly. Download a sharp PNG to print or share. The QR is generated in your browser: the content never goes through our servers.",
      features: [
        "Instant QR code as you type",
        "PNG download at 512, 1024 or 2048 pixels, with a safety margin",
        "Choice of error correction level (L, M, Q or H)",
        "Static QR: the content is stored in the code itself, with no redirect or expiry",
        "100% in-browser processing, without sending the content",
        "Free and no sign-up",
      ],
      faq: [
        {
          q: "How do I generate a free QR code?",
          a: "Type or paste the link or text in the field. The QR code is drawn instantly and the Download PNG button saves the image to your computer.",
        },
        {
          q: "Does the QR code expire?",
          a: "The QR itself doesn't expire: it's static and holds the content directly in the drawing, without going through a redirect service. If it points to a link, the link may still go offline, so check that the destination is still valid.",
        },
        {
          q: "Can I generate a Pix QR code?",
          a: "You can paste the Pix copy-and-paste code generated by your bank and the QR will represent exactly that text. We don't generate or validate Pix, so test scanning in your bank's app before printing or sharing.",
        },
        {
          q: "Which PNG size should I choose?",
          a: "1024 pixels works for most uses. Use 2048 for large-format printing and 512 for small screens.",
        },
        {
          q: "What is the error correction level?",
          a: "It's how much of the QR can be dirty or damaged and still be read. Higher levels tolerate more damage but make the code denser and limit the text size.",
        },
        {
          q: "Can I change the destination after printing?",
          a: "No. Since the QR is static, the content can't be changed afterwards. If the destination changes, you need to generate a new QR code.",
        },
        {
          q: "Is my QR code content sent to any server?",
          a: "No. The QR code is generated in your browser and the text never goes through our servers.",
        },
      ],
      keywords: ["qr code generator", "generate qr code free", "qr code png", "qr code generator no expiry"],
      privacy: "The QR code is generated in your browser. The text or link you type is not sent or stored.",
    },
    "reparador-xml-merchant": {
      shortName: "Google Merchant XML fixer",
      title: "Fix Google Merchant Center XML: feed and GTIN errors",
      description:
        "Validate and fix your Google Merchant Center XML feed: HTML in descriptions, non-standard prices and invalid GTINs that block products in Google Shopping. PRO plan.",
      h1: "Fix your Google Merchant Center XML feed",
      intro:
        "Products rejected in Google Merchant Center because of broken XML, HTML in descriptions or invalid GTINs? Validate the feed, clean the HTML and see the problem GTINs in one click. Your feed is handled in your browser.",
      features: [
        "Validates the feed XML and fixes non-standard prices, stray \"&\" and missing IDs",
        "Removes HTML from descriptions and titles",
        "Strips the GTIN mask and flags GTINs with an invalid check digit",
        "Accepts the XML file or the feed URL",
        "Browser-side handling: the feed content never goes through our servers",
      ],
      faq: [
        {
          q: "What causes errors in a Google Merchant Center XML feed?",
          a: "The most common reasons are malformed XML, stray HTML in descriptions, non-standard prices and GTINs with a mask or an invalid check digit.",
        },
        {
          q: "How do I fix an invalid GTIN in Google Merchant?",
          a: "A GTIN must have 8, 12, 13 or 14 digits and a correct check digit. The tool removes masks (dots and dashes) automatically and flags GTINs with an invalid check digit, which you need to confirm with the manufacturer.",
        },
        {
          q: "Is my feed sent to ResolveLabs servers?",
          a: "No. The XML is handled in your browser. When loading by URL, your own browser fetches the feed, so the feed server must allow access (CORS).",
        },
        {
          q: "Is this tool free?",
          a: "It's part of the PRO plan ({price}), with {trialDays} days free at the start. To just check the structure of an XML, use the XML viewer, which is free.",
        },
      ],
      keywords: ["fix google merchant xml", "google merchant gtin error", "google merchant center xml feed", "validate google shopping xml feed"],
      cta: {
        label: "Open the XML fixer",
        note: "Requires the PRO plan. If you don't have it yet, you'll be taken to see the plan.",
      },
    },
  },
};

export type SeoMessages = Shape<typeof en>;

const es: SeoMessages = {
  schema: { operatingSystem: "Web (navegador)", home: "Inicio" },
  offers: {
    free: { name: "Gratis", description: "Uso gratuito, sin registro." },
    convFree: { name: "Gratis", description: "{freeLimit} conversiones gratuitas." },
    convPro: { name: "PRO", description: "Conversiones ilimitadas. {trialDays} días gratis al empezar." },
    pro: { name: "PRO", description: "{trialDays} días gratis al empezar." },
  },
  privacy: "El archivo se procesa en tu navegador y no pasa por nuestros servidores.",
  bankStepsNote: "Los nombres de los menús cambian según la versión de la app o de la banca por internet.",
  bank: {
    shortName: "Extracto de {bank} a OFX",
    title: "Convertir extracto de {bank} en PDF a OFX online",
    description:
      "Convierte el extracto de {bank} en PDF a un archivo OFX para la conciliación bancaria. Conversión en el navegador, sin enviar el PDF a nuestros servidores. {freeLimit} conversiones gratis.",
    h1: "Convertir el extracto de {bank} de PDF a OFX",
    intro: "¿Descargaste el extracto de {bank} en PDF y necesitas el OFX para el sistema contable? Conviértelo aquí. {privacy}",
    features: [
      "Lee el diseño del extracto en PDF de {bank}",
      "Genera OFX listo para importar en sistemas contables y ERP",
      "Procesamiento 100% en el navegador: el PDF no pasa por nuestros servidores",
      "{freeLimit} conversiones gratuitas; después, el plan PRO",
    ],
    stepsTitle: "Cómo obtener el OFX del extracto de {bank}",
    faq: {
      free: {
        q: "¿Puedo convertir el extracto de {bank} de PDF a OFX gratis?",
        a: "Sí, tienes {freeLimit} conversiones gratuitas. Después, el plan PRO ({price}, con {trialDays} días gratis al empezar) libera conversiones ilimitadas.",
      },
      privacy: {
        q: "¿El PDF de mi extracto de {bank} se envía a algún servidor?",
        a: "No. La lectura del PDF y la generación del OFX ocurren en tu navegador. Solo registramos el contador de usos de tu cuenta, nunca el contenido del archivo.",
      },
      diff: {
        q: "¿Cuál es la diferencia entre un extracto en PDF y en OFX?",
        a: "El PDF es solo visual. El OFX trae fecha, importe, descripción y tipo de cada movimiento de forma estructurada, por eso los sistemas contables pueden importarlo y conciliarlo automáticamente.",
      },
    },
    keywords: ["extracto {bank} ofx", "convertir extracto {bank} pdf a ofx", "cómo descargar extracto ofx {bank}"],
    cta: {
      label: "Convertir mi extracto ahora",
      note: "Crea una cuenta gratuita o inicia sesión para convertir. El PDF se queda en tu navegador.",
    },
    items: {
      nubank: {
        steps: [
          "En la app de Nubank, abre la cuenta (NuConta) y busca la opción de pedir o exportar el extracto.",
          "Elige el período y, si la app lo ofrece, el formato OFX. Si solo hay PDF, descarga el PDF.",
          "Con el PDF en mano, usa el conversor de ResolveLabs para generar el OFX en el navegador.",
          "Importa el OFX en tu sistema contable o financiero.",
        ],
        extra: {
          q: "¿Cómo descargo el extracto de Nubank en OFX?",
          a: "En la app, abre NuConta y usa la opción de pedir el extracto, eligiendo el período y el formato. Si el OFX no está disponible para el período que necesitas, descarga el PDF y conviértelo aquí. {note}",
        },
      },
      itau: {
        steps: [
          "En la banca por internet o en la app de Itaú, abre la pantalla de extracto de la cuenta.",
          "Selecciona el período y busca la opción de guardar el extracto en otros formatos (OFX). Si solo hay PDF, descarga el PDF.",
          "Convierte el PDF en ResolveLabs para generar el OFX directamente en el navegador.",
          "Importa el OFX en tu sistema contable.",
        ],
        extra: {
          q: "¿Cómo generar el extracto de Itaú en OFX?",
          a: "En la pantalla de extracto de la banca por internet, busca la opción de guardar o exportar en otros formatos y elige OFX. Si el período o la cuenta no ofrece OFX, descarga el PDF y conviértelo aquí. {note}",
        },
      },
      bradesco: {
        steps: [
          "En la banca por internet o en la app de Bradesco, abre el extracto de la cuenta.",
          "Define el período y busca la opción de exportar o guardar el extracto en OFX. Si solo hay PDF, descarga el PDF.",
          "Convierte el PDF en ResolveLabs para generar el OFX directamente en el navegador.",
          "Importa el OFX en tu sistema contable.",
        ],
        extra: {
          q: "¿Cómo descargo el extracto de Bradesco en OFX?",
          a: "En el extracto de la banca por internet o de la app, usa la opción de exportar o guardar y elige OFX. Cuando no haya OFX para el período, descarga el PDF y conviértelo aquí. {note}",
        },
      },
    },
  },
  tools: {
    "visualizador-ofx": {
      shortName: "Visor de OFX",
      title: "Visor de OFX online gratis: abrir archivo OFX",
      description:
        "Abre y visualiza cualquier archivo OFX online: mira el saldo, la cuenta y todos los movimientos del extracto. Gratis, sin registro y sin enviar el archivo a servidores.",
      h1: "Visor de OFX online",
      intro:
        "Abre un archivo OFX y mira la cuenta, el saldo y cada movimiento del extracto en segundos. Tu archivo OFX no pasa por nuestros servidores: el procesamiento es 100% en el navegador.",
      features: [
        "Abre archivos OFX y QFX de cualquier banco",
        "Muestra cuenta, período, saldo y todos los movimientos en una tabla",
        "Funciona en el ordenador y en el móvil, sin instalar programas",
        "Procesamiento 100% en el navegador: el archivo no pasa por nuestros servidores",
        "Gratis y sin registro",
      ],
      faq: [
        {
          q: "¿Qué es un archivo OFX?",
          a: "OFX (Open Financial Exchange) es el formato que usan los bancos para exportar extractos de forma estructurada. Trae fecha, importe, descripción y tipo de cada movimiento, y es el estándar para importar extractos en sistemas contables y de conciliación bancaria.",
        },
        {
          q: "¿Cómo abrir un archivo OFX?",
          a: "Elige el archivo en el cuadro de arriba o arrástralo hasta él. ResolveLabs lee el OFX en tu navegador y muestra el extracto en una tabla, sin instalar nada y sin enviar el archivo.",
        },
        {
          q: "¿Mi archivo OFX se envía a algún servidor?",
          a: "No. La lectura ocurre por completo en tu navegador y el archivo no pasa por nuestros servidores.",
        },
        {
          q: "¿Se puede abrir OFX en el móvil?",
          a: "Sí. La página funciona en el navegador del móvil: toca elegir archivo y selecciona el OFX descargado.",
        },
        {
          q: "¿Cómo abrir OFX en Excel o convertirlo a CSV?",
          a: "Este visor muestra el contenido del OFX y permite copiar los datos, pero no genera una hoja de cálculo. Para ver el extracto en columnas, abre el OFX aquí y copia los movimientos a tu hoja de cálculo.",
        },
        {
          q: "¿Cuál es la diferencia entre OFX y CSV?",
          a: "El OFX sigue un estándar con campos definidos (fecha, importe, ID de la transacción), lo que facilita la importación automática. El CSV es una tabla simple y cada banco arma las columnas a su manera.",
        },
        {
          q: "¿El visor modifica mi archivo OFX?",
          a: "No. Solo lee y muestra el contenido; el archivo original no se modifica.",
        },
      ],
      keywords: ["abrir archivo ofx", "ver ofx online", "leer archivo ofx", "qué es un archivo ofx", "abrir ofx en el móvil", "ofx a excel", "ofx o csv"],
    },
    "visualizador-xml": {
      shortName: "Visor de XML",
      title: "Visor de XML online gratis: abrir y ver la estructura del XML",
      description:
        "Abre archivos XML online y navega por la estructura en árbol, incluido el XML de la NF-e brasileña. Gratis, sin registro y sin enviar el archivo a servidores.",
      h1: "Visor de XML online",
      intro:
        "Abre un archivo XML y navega por la estructura en árbol, con etiquetas, atributos y valores. Sirve para ver el contenido del XML de una NF-e, de un feed de productos o de cualquier otro archivo. El archivo no pasa por nuestros servidores.",
      features: [
        "Muestra el XML en árbol, con etiquetas, atributos y valores",
        "Útil para revisar el contenido del XML de NF-e, NFC-e y CT-e",
        "Señala XML mal formado, con el mensaje de error",
        "Copia un nodo o el XML completo formateado",
        "Procesamiento 100% en el navegador, sin enviar el archivo",
      ],
      faq: [
        {
          q: "¿Cómo abrir un archivo XML?",
          a: "Elige el archivo en el cuadro de arriba o arrástralo hasta él. El XML se lee en tu navegador y se muestra en árbol, sin instalar nada.",
        },
        {
          q: "¿Se puede ver el contenido del XML de una NF-e?",
          a: "Sí, puedes navegar por todos los campos del XML de la NF-e (emisor, destinatario, ítems, impuestos, clave de acceso). Esta herramienta muestra la estructura y los datos del XML; no genera el DANFE en PDF.",
        },
        {
          q: "¿El XML se envía a algún servidor?",
          a: "No. La lectura ocurre en tu navegador y el archivo no pasa por nuestros servidores.",
        },
        {
          q: "¿Cómo saber si mi XML está mal formado?",
          a: "Al abrirlo, la herramienta intenta interpretar el XML. Si hay una etiqueta abierta y sin cerrar o un carácter inválido, muestra el error encontrado. Comprueba que el XML esté bien formado; no valida contra un esquema (XSD).",
        },
        {
          q: "¿Funciona con XML grandes?",
          a: "Los archivos de texto grandes se cargan en la memoria del navegador, con un límite de 60 MB. Por encima de eso, la herramienta avisa.",
        },
      ],
      keywords: ["ver xml online", "abrir archivo xml", "ver estructura xml nfe", "ver xml nfe online", "validar xml online"],
    },
    "visualizador-planilhas": {
      shortName: "Visor de XLSX y CSV",
      title: "Abrir XLSX y CSV online gratis: visor de hojas de cálculo",
      description:
        "Abre hojas de cálculo XLSX, XLS, CSV y ODS online, sin Excel. Mira hojas y celdas directamente en el navegador, gratis y sin enviar el archivo a servidores.",
      h1: "Abrir XLSX y CSV online",
      intro:
        "Mira el contenido de hojas de cálculo XLSX, XLS, CSV, TSV y ODS sin necesidad de Excel. El archivo se abre en tu navegador y no pasa por nuestros servidores.",
      features: [
        "Abre XLSX, XLSM, XLS, CSV, TSV y ODS",
        "Navega entre hojas y se desplaza por hojas de cálculo grandes",
        "Copia celdas individuales",
        "Detecta el tipo real del archivo por su contenido, no solo por la extensión",
        "Procesamiento 100% en el navegador, sin enviar el archivo",
      ],
      faq: [
        {
          q: "¿Cómo abrir un archivo XLSX sin Excel?",
          a: "Elige el archivo en el cuadro de arriba o arrástralo. La hoja de cálculo se lee en el navegador y se muestra con sus hojas y celdas, sin instalar ningún programa.",
        },
        {
          q: "¿Cómo abrir un CSV online?",
          a: "Usa el mismo cuadro: el CSV se abre en formato de tabla. Esto evita el problema de columnas pegadas cuando Excel interpreta mal el separador.",
        },
        {
          q: "¿Mi archivo se envía a algún servidor?",
          a: "No. La hoja de cálculo se lee en tu navegador y no pasa por nuestros servidores.",
        },
        {
          q: "¿Este visor edita hojas de cálculo?",
          a: "No. Sirve para leer y copiar el contenido. El archivo original no se modifica.",
        },
      ],
      keywords: ["abrir xlsx online", "abrir csv online", "ver csv online", "abrir hoja de cálculo sin excel"],
    },
    "visualizador-json": {
      shortName: "Visor de JSON",
      title: "Visor de JSON online gratis: abrir archivo JSON",
      description:
        "Abre y visualiza archivos JSON en árbol, con formato y legibles. Gratis, sin registro y sin enviar el archivo a servidores.",
      h1: "Visor de JSON online",
      intro:
        "Abre un archivo JSON y navega por la estructura en árbol, con objetos, listas y valores. El archivo se lee en tu navegador y no pasa por nuestros servidores.",
      features: [
        "Muestra el JSON en árbol, expandiendo y contrayendo niveles",
        "Señala JSON inválido con el mensaje de error",
        "Copia un nodo o el JSON completo formateado",
        "Procesamiento 100% en el navegador, sin enviar el archivo",
      ],
      faq: [
        {
          q: "¿Cómo abrir un archivo JSON?",
          a: "Elige el archivo en el cuadro de arriba o arrástralo hasta él. El JSON se lee en el navegador y se muestra en árbol.",
        },
        {
          q: "¿El JSON se envía a algún servidor?",
          a: "No. La lectura ocurre en tu navegador y el archivo no pasa por nuestros servidores.",
        },
        {
          q: "¿Cómo saber si un JSON es válido?",
          a: "Al abrirlo, la herramienta intenta interpretar el contenido. Si hay una coma de más, comillas que faltan u otro error de sintaxis, muestra el mensaje de error.",
        },
      ],
      keywords: ["ver json online", "abrir archivo json", "abrir json online"],
    },
    "conversor-pdf-para-ofx": {
      shortName: "Conversor de PDF a OFX",
      title: "Convertir PDF a OFX online: extracto bancario para conciliación",
      description:
        "Convierte un extracto bancario en PDF a OFX directamente en el navegador, sin enviar el PDF a nuestros servidores. {freeLimit} conversiones gratis, luego plan PRO.",
      h1: "Convertir extracto PDF a OFX",
      intro:
        "Transforma el extracto bancario en PDF en un archivo OFX listo para importar en el sistema contable. Tu PDF no pasa por nuestros servidores: el procesamiento es 100% en el navegador.",
      features: [
        "Convierte extractos en PDF de Nubank, Inter, Itaú y Bradesco",
        "Genera OFX listo para importar en sistemas contables y ERP",
        "Procesamiento 100% en el navegador: el PDF no pasa por nuestros servidores",
        "{freeLimit} conversiones gratuitas; después, plan PRO con conversiones ilimitadas",
      ],
      faq: [
        {
          q: "¿Cómo convertir PDF a OFX?",
          a: "Inicia sesión en tu cuenta gratuita, abre el conversor y sube el extracto en PDF. El archivo se lee en tu navegador, se identifican los movimientos y se genera el OFX para que lo descargues.",
        },
        {
          q: "¿Se puede convertir PDF a OFX gratis?",
          a: "Sí. Tienes {freeLimit} conversiones gratuitas. Después, el plan PRO ({price}, con {trialDays} días gratis al empezar) libera conversiones ilimitadas.",
        },
        {
          q: "¿Mi PDF se envía a algún servidor?",
          a: "No. La lectura del PDF y la generación del OFX ocurren en tu navegador. Solo registramos el contador de usos de tu cuenta, nunca el contenido del archivo.",
        },
        {
          q: "¿Qué bancos se aceptan?",
          a: "Nubank, Inter, Itaú y Bradesco. Si tu banco no está en la lista, abre un ticket en soporte enviando el diseño del extracto, sin datos sensibles.",
        },
        {
          q: "¿Cuál es la diferencia entre un extracto en PDF y en OFX?",
          a: "El PDF es solo visual. El OFX trae fecha, importe, descripción y tipo de cada movimiento de forma estructurada, por eso los sistemas contables pueden importarlo y conciliarlo automáticamente.",
        },
        {
          q: "¿Cómo revisar el OFX generado?",
          a: "Abre el archivo en el visor de OFX de ResolveLabs para revisar el saldo y los movimientos antes de importarlo en el sistema.",
        },
      ],
      keywords: ["convertir pdf a ofx", "pdf a ofx gratis", "convertir extracto pdf a ofx", "extracto pdf a ofx online"],
      cta: {
        label: "Abrir el conversor",
        note: "Crea una cuenta gratuita o inicia sesión para convertir. El PDF se queda en tu navegador.",
      },
    },
    "planilha-para-ofx": {
      shortName: "Conversor de hoja de cálculo a OFX",
      title: "Convertir hoja de cálculo (CSV o Excel) a OFX online gratis",
      description:
        "Convierte CSV, XLSX o XLS a un archivo OFX para la conciliación bancaria: elige las columnas de fecha, descripción e importe y descarga el OFX. Gratis, en el navegador, sin enviar la hoja de cálculo.",
      h1: "Convertir hoja de cálculo a OFX",
      intro:
        "¿Tienes el extracto en CSV o Excel y necesitas el OFX para el sistema contable? Sube la hoja de cálculo, indica qué columnas son fecha, descripción e importe y descarga el archivo. Tu hoja de cálculo no pasa por nuestros servidores: el procesamiento es 100% en el navegador.",
      features: [
        "Lee CSV, XLSX, XLS y ODS, incluido el CSV brasileño (separador punto y coma, números 1.234,56)",
        "Mapeo de columnas: tú eliges cuál es la fecha, la descripción y el importe",
        "Acepta una columna de importe con signo o columnas separadas de débito y crédito",
        "Vista previa, total de entradas y salidas y lista de filas omitidas antes de descargar",
        "Procesamiento 100% en el navegador: la hoja de cálculo no pasa por nuestros servidores",
        "Gratis y sin registro",
      ],
      faq: [
        {
          q: "¿Cómo convertir una hoja de cálculo a OFX?",
          a: "Sube el archivo CSV o Excel, elige en las listas qué columna es la fecha, la descripción y el importe, revisa la vista previa y haz clic en generar. El OFX se crea en tu navegador y la descarga empieza al instante.",
        },
        {
          q: "¿Qué formatos de hoja de cálculo se aceptan?",
          a: "CSV, TSV, XLSX, XLSM, XLS y ODS, de hasta 20 MB y 50 mil filas. En CSV, el punto y coma, la coma y el tabulador se detectan automáticamente, así como la codificación UTF-8 o Windows-1252.",
        },
        {
          q: "¿Cómo debe estar organizada la hoja de cálculo?",
          a: "Una fila por movimiento, con al menos una columna de fecha y una de importe. La descripción es opcional, pero ayuda en la conciliación. Si la primera fila es el encabezado, la herramienta sugiere las columnas por el nombre (Fecha, Concepto, Importe).",
        },
        {
          q: "¿Qué formatos de fecha e importe funcionan?",
          a: "Fechas como 31/01/2026, 31/01/26, 2026-01-31 y fechas de Excel. Importes como 1.234,56, 1,234.56, R$ 1.234,56, (1.234,56) para negativo y con sufijo D o C. El formato del número se detecta por la columna completa y puedes elegirlo manualmente.",
        },
        {
          q: "Mi hoja de cálculo tiene débito y crédito en columnas separadas. ¿Funciona?",
          a: "Sí. Cambia la opción de importes a columnas separadas e indica la columna de débito (pasa a ser salida) y la de crédito (pasa a ser entrada).",
        },
        {
          q: "¿Qué pasa con las filas inválidas?",
          a: "Las filas en blanco se omiten sin aviso. Las filas con fecha o importe inválidos también quedan fuera del OFX, y la herramienta muestra cuántas fueron y el número de las primeras, para que corrijas la hoja de cálculo si quieres.",
        },
        {
          q: "¿El OFX generado incluye el saldo de la cuenta?",
          a: "No. El archivo trae los movimientos, el período y los datos de la cuenta que indiques. Comprueba la importación en tu sistema contable antes de usarlo en producción.",
        },
        {
          q: "¿Mi hoja de cálculo se envía a algún servidor?",
          a: "No. La lectura de la hoja de cálculo y la generación del OFX ocurren en tu navegador y el archivo no pasa por nuestros servidores.",
        },
      ],
      keywords: ["convertir hoja de cálculo a ofx", "csv a ofx", "excel a ofx", "xlsx a ofx", "convertir csv a ofx online gratis"],
      privacy:
        "La hoja de cálculo se lee y se convierte en tu navegador y no pasa por nuestros servidores. Puedes usar extractos de clientes sin exponer su contenido a terceros.",
    },
    "gerador-senhas": {
      shortName: "Generador de contraseñas",
      title: "Generador de contraseñas fuertes y aleatorias online gratis",
      description:
        "Genera contraseñas fuertes y aleatorias de 8 a 64 caracteres, con letras, números y símbolos. Gratis, sin registro, y la contraseña nunca sale de tu navegador.",
      h1: "Generador de contraseñas fuertes",
      intro:
        "Crea una contraseña aleatoria y fuerte en un clic: elige la longitud y los tipos de carácter. La contraseña se genera en tu navegador y no se envía ni se guarda en ningún lugar.",
      features: [
        "Longitud de 8 a 64 caracteres, con mayúsculas, minúsculas, números y símbolos",
        "Aleatoriedad segura del navegador (crypto.getRandomValues), sin Math.random",
        "Opción para evitar caracteres parecidos, como O y 0 o I y l",
        "Estimación de fortaleza en bits de entropía",
        "La contraseña no se envía ni se almacena: queda solo en tu pantalla",
        "Gratis y sin registro",
      ],
      faq: [
        {
          q: "¿Cómo generar una contraseña fuerte y aleatoria?",
          a: "Ajusta la longitud, marca los tipos de carácter y copia la contraseña. Para cuentas importantes, usa 16 caracteres o más, con los cuatro tipos, y una contraseña distinta para cada servicio.",
        },
        {
          q: "¿La contraseña generada se envía o se guarda en algún servidor?",
          a: "No. Se crea en tu navegador y desaparece cuando cierras o recargas la página. Ningún valor de contraseña se envía, y solo contamos que la herramienta fue usada, sin el contenido.",
        },
        {
          q: "¿Esta contraseña es realmente aleatoria?",
          a: "Sí. El generador usa la generación de números aleatorios criptográficamente segura del navegador y sortea cada carácter sin sesgo. Garantizamos al menos un carácter de cada tipo marcado.",
        },
        {
          q: "¿Cuál es la longitud ideal de una contraseña?",
          a: "Cuanto más larga, más fuerte. Para la mayoría de las cuentas, 16 caracteres aleatorios ya son difíciles de descifrar. La estimación de fortaleza muestra la entropía en bits: por encima de 80 bits se considera muy fuerte.",
        },
        {
          q: "¿Cómo guardar tantas contraseñas?",
          a: "Usa un gestor de contraseñas. Guarda cada contraseña única de forma cifrada y rellena los formularios por ti.",
        },
        {
          q: "¿Puedo usarla para la contraseña del Wi-Fi?",
          a: "Sí. Para escribirla fácilmente en el móvil, desmarca los símbolos, marca la opción de evitar caracteres parecidos y usa una longitud mayor para compensar.",
        },
      ],
      keywords: ["generador de contraseñas", "generador de contraseña segura", "generar contraseña aleatoria", "generador de contraseñas online gratis"],
      privacy:
        "La contraseña se genera en tu navegador con generación aleatoria segura. No se envía, guarda ni registra: desaparece cuando cierras la página.",
    },
    "gerador-qrcode": {
      shortName: "Generador de códigos QR",
      title: "Generador de códigos QR gratis: crea y descarga en PNG",
      description:
        "Crea un código QR de un enlace o texto al instante y descárgalo en PNG de alta resolución. Gratis, sin registro, sin caducidad, y el contenido nunca sale de tu navegador.",
      h1: "Generador de códigos QR gratis",
      intro:
        "Escribe un enlace o texto y el código QR aparece al instante. Descarga un PNG nítido para imprimir o compartir. El QR se genera en tu navegador: el contenido no pasa por nuestros servidores.",
      features: [
        "Código QR instantáneo mientras escribes",
        "Descarga en PNG de 512, 1024 o 2048 píxeles, con margen de seguridad",
        "Elección del nivel de corrección de errores (L, M, Q o H)",
        "QR estático: el contenido queda grabado en el propio código, sin redirección ni caducidad",
        "Procesamiento 100% en el navegador, sin enviar el contenido",
        "Gratis y sin registro",
      ],
      faq: [
        {
          q: "¿Cómo generar un código QR gratis?",
          a: "Escribe o pega el enlace o texto en el campo. El código QR se dibuja al instante y el botón Descargar PNG guarda la imagen en tu ordenador.",
        },
        {
          q: "¿El código QR caduca?",
          a: "El QR en sí no caduca: es estático y guarda el contenido directamente en el dibujo, sin pasar por un servicio de redirección. Si apunta a un enlace, el enlace aún puede dejar de funcionar, así que comprueba que el destino sigue siendo válido.",
        },
        {
          q: "¿Puedo generar un QR de Pix?",
          a: "Puedes pegar el código Pix copia y pega generado por tu banco y el QR representará exactamente ese texto. No generamos ni validamos el Pix, así que prueba la lectura en la app de tu banco antes de imprimir o difundir.",
        },
        {
          q: "¿Qué tamaño de PNG debo elegir?",
          a: "1024 píxeles sirve para la mayoría de los usos. Usa 2048 para impresión en tamaño grande y 512 para pantallas pequeñas.",
        },
        {
          q: "¿Qué es el nivel de corrección de errores?",
          a: "Es cuánto del QR puede estar sucio o dañado y aun así leerse. Los niveles más altos toleran más daño, pero hacen el código más denso y limitan el tamaño del texto.",
        },
        {
          q: "¿Puedo cambiar el destino después de imprimir?",
          a: "No. Como el QR es estático, el contenido no se puede modificar después. Si el destino cambia, hay que generar un nuevo código QR.",
        },
        {
          q: "¿El contenido de mi código QR se envía a algún servidor?",
          a: "No. El código QR se genera en tu navegador y el texto no pasa por nuestros servidores.",
        },
      ],
      keywords: ["generador de código qr", "generar código qr gratis", "código qr png", "generador de código qr sin caducidad"],
      privacy: "El código QR se genera en tu navegador. El texto o enlace que escribes no se envía ni se almacena.",
    },
    "reparador-xml-merchant": {
      shortName: "Reparador de XML de Google Merchant",
      title: "Corregir XML de Google Merchant Center: errores de feed y GTIN",
      description:
        "Valida y corrige el feed XML de Google Merchant Center: HTML en las descripciones, precios fuera del estándar y GTIN inválidos que bloquean productos en Google Shopping. Plan PRO.",
      h1: "Corregir el feed XML de Google Merchant Center",
      intro:
        "¿Productos rechazados en Google Merchant Center por XML roto, HTML en las descripciones o GTIN inválido? Valida el feed, limpia el HTML y mira los GTIN con problemas en un clic. Tu feed se procesa en el navegador.",
      features: [
        "Valida el XML del feed y corrige precios fuera del estándar, \"&\" sueltos e IDs ausentes",
        "Elimina el HTML de descripciones y títulos",
        "Quita la máscara del GTIN y señala los GTIN con dígito verificador inválido",
        "Acepta el archivo XML o la URL del feed",
        "Procesamiento en el navegador: el contenido del feed no pasa por nuestros servidores",
      ],
      faq: [
        {
          q: "¿Qué causa errores en el feed XML de Google Merchant Center?",
          a: "Los motivos más comunes son XML mal formado, HTML suelto en las descripciones, precios fuera del estándar y GTIN con máscara o dígito verificador inválido.",
        },
        {
          q: "¿Cómo corregir un GTIN inválido en Google Merchant?",
          a: "El GTIN debe tener 8, 12, 13 o 14 dígitos y un dígito verificador correcto. La herramienta quita las máscaras (puntos y guiones) automáticamente y señala los GTIN con dígito verificador inválido, que debes comprobar con el fabricante.",
        },
        {
          q: "¿Mi feed se envía a los servidores de ResolveLabs?",
          a: "No. El XML se procesa en tu navegador. Al cargar por URL, tu propio navegador obtiene el feed, así que el servidor del feed debe permitir el acceso (CORS).",
        },
        {
          q: "¿Esta herramienta es gratuita?",
          a: "Forma parte del plan PRO ({price}), con {trialDays} días gratis al empezar. Para solo revisar la estructura de un XML, usa el visor de XML, que es gratuito.",
        },
      ],
      keywords: ["corregir xml google merchant", "error gtin google merchant", "google merchant center xml feed", "validar feed xml google shopping"],
      cta: {
        label: "Abrir el reparador de XML",
        note: "Requiere el plan PRO. Si aún no lo tienes, te llevaremos a ver el plan.",
      },
    },
  },
};

const pt: SeoMessages = {
  schema: { operatingSystem: "Web (navegador)", home: "Home" },
  offers: {
    free: { name: "Gratuito", description: "Uso gratuito, sem cadastro." },
    convFree: { name: "Gratuito", description: "{freeLimit} conversões gratuitas." },
    convPro: { name: "PRO", description: "Conversões ilimitadas. {trialDays} dias grátis no início." },
    pro: { name: "PRO", description: "{trialDays} dias grátis no início." },
  },
  privacy: "O arquivo é processado no seu navegador e não passa pelos nossos servidores.",
  bankStepsNote: "Os nomes dos menus mudam conforme a versão do app ou do internet banking.",
  bank: {
    shortName: "Extrato {bank} em OFX",
    title: "Converter extrato {bank} em PDF para OFX online",
    description:
      "Transforme o extrato do {bank} em PDF em arquivo OFX para conciliação bancária. Conversão no navegador, sem enviar o PDF aos nossos servidores. {freeLimit} conversões grátis.",
    h1: "Converter extrato do {bank} de PDF para OFX",
    intro: "Baixou o extrato do {bank} em PDF e precisa do OFX para o sistema contábil? Converta aqui. {privacy}",
    features: [
      "Lê o layout de extrato em PDF do {bank}",
      "Gera OFX pronto para importar em sistemas contábeis e ERPs",
      "Processamento 100% no navegador: o PDF não passa pelos nossos servidores",
      "{freeLimit} conversões gratuitas; depois, plano PRO",
    ],
    stepsTitle: "Como gerar o OFX do extrato do {bank}",
    faq: {
      free: {
        q: "Posso converter o extrato do {bank} de PDF para OFX de graça?",
        a: "Sim, você tem {freeLimit} conversões gratuitas. Depois disso, o plano PRO ({price}, com {trialDays} dias grátis no início) libera conversões ilimitadas.",
      },
      privacy: {
        q: "O PDF do meu extrato do {bank} é enviado para algum servidor?",
        a: "Não. A leitura do PDF e a geração do OFX acontecem no seu navegador. Só registramos o contador de usos da sua conta, nunca o conteúdo do arquivo.",
      },
      diff: {
        q: "Qual a diferença entre extrato em PDF e em OFX?",
        a: "O PDF é só visual. O OFX traz data, valor, descrição e tipo de cada lançamento de forma estruturada, por isso sistemas contábeis conseguem importar e conciliar automaticamente.",
      },
    },
    keywords: ["extrato {bank} ofx", "converter extrato {bank} pdf para ofx", "como baixar extrato ofx {bank}"],
    cta: {
      label: "Converter meu extrato agora",
      note: "Crie uma conta gratuita ou entre para converter. O PDF continua no seu navegador.",
    },
    items: {
      nubank: {
        steps: [
          "No app do Nubank, abra a conta (NuConta) e procure a opção de pedir ou exportar o extrato.",
          "Escolha o período e, se o app oferecer, o formato OFX. Se só houver PDF, baixe o PDF.",
          "Com o PDF em mãos, use o conversor do ResolveLabs para gerar o OFX no navegador.",
          "Importe o OFX no seu sistema contábil ou financeiro.",
        ],
        extra: {
          q: "Como baixar o extrato do Nubank em OFX?",
          a: "No app, abra a NuConta e use a opção de pedir o extrato, escolhendo o período e o formato. Quando o OFX não estiver disponível para o período que você precisa, baixe o PDF e converta aqui. {note}",
        },
      },
      itau: {
        steps: [
          "No internet banking ou no app do Itaú, abra a tela de extrato da conta.",
          "Selecione o período e procure a opção de salvar o extrato em outros formatos (OFX). Se só houver PDF, baixe o PDF.",
          "Converta o PDF no ResolveLabs para gerar o OFX direto no navegador.",
          "Importe o OFX no seu sistema contábil.",
        ],
        extra: {
          q: "Como gerar o extrato do Itaú em OFX?",
          a: "Na tela de extrato do internet banking, procure a opção de salvar ou exportar em outros formatos e escolha OFX. Se o período ou a conta não oferecer OFX, baixe o PDF e converta aqui. {note}",
        },
      },
      bradesco: {
        steps: [
          "No internet banking ou no app do Bradesco, abra o extrato da conta.",
          "Defina o período e procure a opção de exportar ou salvar o extrato em OFX. Se só houver PDF, baixe o PDF.",
          "Converta o PDF no ResolveLabs para gerar o OFX direto no navegador.",
          "Importe o OFX no seu sistema contábil.",
        ],
        extra: {
          q: "Como baixar o extrato do Bradesco em OFX?",
          a: "No extrato do internet banking ou do app, use a opção de exportar ou salvar e escolha OFX. Quando não houver OFX para o período, baixe o PDF e converta aqui. {note}",
        },
      },
    },
  },
  tools: {
    "visualizador-ofx": {
      shortName: "Visualizador de OFX",
      title: "Visualizador de OFX online grátis: abrir arquivo OFX",
      description:
        "Abra e visualize qualquer arquivo OFX online: veja saldo, conta e todos os lançamentos do extrato. Grátis, sem cadastro e sem enviar o arquivo a servidores.",
      h1: "Visualizador de OFX online",
      intro:
        "Abra um arquivo OFX e veja a conta, o saldo e cada lançamento do extrato em segundos. Seu arquivo OFX não passa pelos nossos servidores: o processamento é 100% no navegador.",
      features: [
        "Abre arquivos OFX e QFX de qualquer banco",
        "Mostra conta, período, saldo e todos os lançamentos em tabela",
        "Funciona no computador e no celular, sem instalar programa",
        "Processamento 100% no navegador: o arquivo não passa pelos nossos servidores",
        "Gratuito e sem cadastro",
      ],
      faq: [
        {
          q: "O que é um arquivo OFX?",
          a: "OFX (Open Financial Exchange) é o formato que bancos usam para exportar extratos de forma estruturada. Ele traz data, valor, descrição e tipo de cada lançamento, e é o padrão para importar extratos em sistemas contábeis e de conciliação bancária.",
        },
        {
          q: "Como abrir um arquivo OFX?",
          a: "Escolha o arquivo na caixa acima ou arraste-o para ela. O ResolveLabs lê o OFX no seu navegador e mostra o extrato em tabela, sem instalar nada e sem enviar o arquivo.",
        },
        {
          q: "Meu arquivo OFX é enviado para algum servidor?",
          a: "Não. A leitura acontece inteiramente no seu navegador e o arquivo não passa pelos nossos servidores.",
        },
        {
          q: "Dá para abrir OFX no celular?",
          a: "Sim. A página funciona no navegador do celular: toque em escolher arquivo e selecione o OFX baixado.",
        },
        {
          q: "Como abrir OFX no Excel ou converter para CSV?",
          a: "Este visualizador mostra o conteúdo do OFX e permite copiar os dados, mas não gera planilha. Para ver o extrato com colunas, você pode abrir o OFX aqui e copiar os lançamentos para a sua planilha.",
        },
        {
          q: "Qual a diferença entre OFX e CSV?",
          a: "O OFX segue um padrão com campos definidos (data, valor, ID da transação), o que facilita a importação automática. O CSV é uma tabela simples e cada banco monta as colunas do seu jeito.",
        },
        {
          q: "O visualizador altera o meu arquivo OFX?",
          a: "Não. Ele apenas lê e exibe o conteúdo; o arquivo original não é modificado.",
        },
      ],
      keywords: ["abrir arquivo ofx", "visualizar ofx online", "ler arquivo ofx", "arquivo ofx o que é", "abrir ofx no celular", "ofx para excel", "ofx ou csv"],
    },
    "visualizador-xml": {
      shortName: "Visualizador de XML",
      title: "Visualizador de XML online grátis: abrir e ver estrutura do XML",
      description:
        "Abra arquivos XML online e navegue pela estrutura em árvore, inclusive o XML de NF-e. Grátis, sem cadastro e sem enviar o arquivo a servidores.",
      h1: "Visualizador de XML online",
      intro:
        "Abra um arquivo XML e navegue pela estrutura em árvore, com tags, atributos e valores. Serve para ver o conteúdo do XML de uma NF-e, de um feed de produtos ou de qualquer outro arquivo. O arquivo não passa pelos nossos servidores.",
      features: [
        "Mostra o XML em árvore, com tags, atributos e valores",
        "Útil para conferir o conteúdo do XML de NF-e, NFC-e e CT-e",
        "Aponta XML mal formado, com a mensagem de erro",
        "Copia um nó ou o XML inteiro formatado",
        "Processamento 100% no navegador, sem enviar o arquivo",
      ],
      faq: [
        {
          q: "Como abrir um arquivo XML?",
          a: "Escolha o arquivo na caixa acima ou arraste-o até ela. O XML é lido no seu navegador e exibido em árvore, sem instalar nada.",
        },
        {
          q: "Dá para ver o conteúdo do XML de uma NF-e?",
          a: "Sim, você consegue navegar por todos os campos do XML da NF-e (emitente, destinatário, itens, impostos, chave de acesso). Esta ferramenta mostra a estrutura e os dados do XML; ela não gera o DANFE em PDF.",
        },
        {
          q: "O XML é enviado para algum servidor?",
          a: "Não. A leitura acontece no seu navegador e o arquivo não passa pelos nossos servidores.",
        },
        {
          q: "Como saber se meu XML está mal formado?",
          a: "Ao abrir, a ferramenta tenta interpretar o XML. Se houver tag aberta e não fechada ou caractere inválido, ela mostra o erro encontrado. Ela verifica se o XML está bem formado; não valida contra um schema (XSD).",
        },
        {
          q: "Funciona com XML grande?",
          a: "Arquivos de texto grandes são carregados na memória do navegador, com limite de 60 MB. Acima disso, a ferramenta avisa.",
        },
      ],
      keywords: ["visualizar xml online", "abrir arquivo xml", "ver estrutura xml nfe", "visualizar xml nfe online", "validar xml online"],
    },
    "visualizador-planilhas": {
      shortName: "Visualizador de XLSX e CSV",
      title: "Abrir XLSX e CSV online grátis: visualizador de planilhas",
      description:
        "Abra planilhas XLSX, XLS, CSV e ODS online, sem Excel. Veja abas e células direto no navegador, grátis e sem enviar o arquivo a servidores.",
      h1: "Abrir XLSX e CSV online",
      intro:
        "Veja o conteúdo de planilhas XLSX, XLS, CSV, TSV e ODS sem precisar do Excel. O arquivo é aberto no seu navegador e não passa pelos nossos servidores.",
      features: [
        "Abre XLSX, XLSM, XLS, CSV, TSV e ODS",
        "Navega entre abas e rola planilhas grandes",
        "Copia células individuais",
        "Detecta o tipo real do arquivo pelo conteúdo, não só pela extensão",
        "Processamento 100% no navegador, sem enviar o arquivo",
      ],
      faq: [
        {
          q: "Como abrir um arquivo XLSX sem o Excel?",
          a: "Escolha o arquivo na caixa acima ou arraste-o. A planilha é lida no navegador e exibida com as abas e células, sem instalar programa.",
        },
        {
          q: "Como abrir um CSV online?",
          a: "Use a mesma caixa: o CSV é aberto em formato de tabela. Isso evita o problema de colunas coladas quando o Excel interpreta o separador errado.",
        },
        {
          q: "Meu arquivo é enviado para algum servidor?",
          a: "Não. A planilha é lida no seu navegador e não passa pelos nossos servidores.",
        },
        {
          q: "Este visualizador edita planilhas?",
          a: "Não. Ele serve para ler e copiar o conteúdo. O arquivo original não é modificado.",
        },
      ],
      keywords: ["abrir xlsx online", "abrir csv online", "visualizar csv online", "abrir planilha sem excel"],
    },
    "visualizador-json": {
      shortName: "Visualizador de JSON",
      title: "Visualizador de JSON online grátis: abrir arquivo JSON",
      description:
        "Abra e visualize arquivos JSON em árvore, formatado e legível. Grátis, sem cadastro e sem enviar o arquivo a servidores.",
      h1: "Visualizador de JSON online",
      intro:
        "Abra um arquivo JSON e navegue pela estrutura em árvore, com objetos, listas e valores. O arquivo é lido no seu navegador e não passa pelos nossos servidores.",
      features: [
        "Mostra o JSON em árvore, expandindo e recolhendo níveis",
        "Aponta JSON inválido com a mensagem de erro",
        "Copia um nó ou o JSON inteiro formatado",
        "Processamento 100% no navegador, sem enviar o arquivo",
      ],
      faq: [
        {
          q: "Como abrir um arquivo JSON?",
          a: "Escolha o arquivo na caixa acima ou arraste-o até ela. O JSON é lido no navegador e exibido em árvore.",
        },
        {
          q: "O JSON é enviado para algum servidor?",
          a: "Não. A leitura acontece no seu navegador e o arquivo não passa pelos nossos servidores.",
        },
        {
          q: "Como saber se um JSON é válido?",
          a: "Ao abrir, a ferramenta tenta interpretar o conteúdo. Se houver vírgula sobrando, aspas faltando ou outro erro de sintaxe, ela mostra a mensagem do erro.",
        },
      ],
      keywords: ["visualizar json online", "abrir arquivo json", "abrir json online"],
    },
    "conversor-pdf-para-ofx": {
      shortName: "Conversor de PDF para OFX",
      title: "Converter PDF para OFX online: extrato bancário para conciliação",
      description:
        "Converta extrato bancário em PDF para OFX direto no navegador, sem enviar o PDF aos nossos servidores. {freeLimit} conversões grátis, depois plano PRO.",
      h1: "Converter extrato PDF para OFX",
      intro:
        "Transforme o extrato bancário em PDF em um arquivo OFX pronto para importar no sistema contábil. Seu PDF não passa pelos nossos servidores: o processamento é 100% no navegador.",
      features: [
        "Converte extratos em PDF de Nubank, Inter, Itaú e Bradesco",
        "Gera OFX pronto para importar em sistemas contábeis e ERPs",
        "Processamento 100% no navegador: o PDF não passa pelos nossos servidores",
        "{freeLimit} conversões gratuitas; depois, plano PRO com conversões ilimitadas",
      ],
      faq: [
        {
          q: "Como converter PDF para OFX?",
          a: "Entre na sua conta gratuita, abra o conversor e envie o extrato em PDF. O arquivo é lido no seu navegador, os lançamentos são identificados e o OFX é gerado para você baixar.",
        },
        {
          q: "Dá para converter PDF para OFX de graça?",
          a: "Sim. Você tem {freeLimit} conversões gratuitas. Depois, o plano PRO ({price}, com {trialDays} dias grátis no início) libera conversões ilimitadas.",
        },
        {
          q: "O meu PDF é enviado para algum servidor?",
          a: "Não. A leitura do PDF e a geração do OFX acontecem no seu navegador. Só registramos o contador de usos da sua conta, nunca o conteúdo do arquivo.",
        },
        {
          q: "Quais bancos são aceitos?",
          a: "Nubank, Inter, Itaú e Bradesco. Se o seu banco não estiver na lista, abra um ticket pelo suporte enviando o layout do extrato, sem dados sensíveis.",
        },
        {
          q: "Qual a diferença entre extrato em PDF e em OFX?",
          a: "O PDF é só visual. O OFX traz data, valor, descrição e tipo de cada lançamento de forma estruturada, por isso sistemas contábeis conseguem importar e conciliar automaticamente.",
        },
        {
          q: "Como conferir o OFX gerado?",
          a: "Abra o arquivo no visualizador de OFX do ResolveLabs para conferir saldo e lançamentos antes de importar no sistema.",
        },
      ],
      keywords: ["converter pdf para ofx", "pdf para ofx grátis", "converter extrato pdf para ofx", "extrato pdf para ofx online"],
      cta: {
        label: "Abrir o conversor",
        note: "Crie uma conta gratuita ou entre para converter. O PDF continua no seu navegador.",
      },
    },
    "planilha-para-ofx": {
      shortName: "Conversor de planilha para OFX",
      title: "Converter planilha (CSV ou Excel) para OFX online grátis",
      description:
        "Converta CSV, XLSX ou XLS em arquivo OFX para conciliação bancária: escolha as colunas de data, descrição e valor e baixe o OFX. Grátis, no navegador, sem enviar a planilha.",
      h1: "Converter planilha para OFX",
      intro:
        "Tem o extrato em CSV ou Excel e precisa do OFX para o sistema contábil? Envie a planilha, indique quais colunas são data, descrição e valor e baixe o arquivo. Sua planilha não passa pelos nossos servidores: o processamento é 100% no navegador.",
      features: [
        "Lê CSV, XLSX, XLS e ODS, inclusive CSV brasileiro (separador ponto e vírgula, números 1.234,56)",
        "Mapeamento de colunas: você escolhe qual é a data, a descrição e o valor",
        "Aceita uma coluna de valor com sinal ou colunas separadas de débito e crédito",
        "Prévia, total de entradas e saídas e lista de linhas ignoradas antes de baixar",
        "Processamento 100% no navegador: a planilha não passa pelos nossos servidores",
        "Gratuito e sem cadastro",
      ],
      faq: [
        {
          q: "Como converter planilha para OFX?",
          a: "Envie o arquivo CSV ou Excel, escolha nas listas qual coluna é a data, a descrição e o valor, confira a prévia e clique em gerar. O OFX é criado no seu navegador e o download começa na hora.",
        },
        {
          q: "Quais formatos de planilha são aceitos?",
          a: "CSV, TSV, XLSX, XLSM, XLS e ODS, com até 20 MB e 50 mil linhas. Em CSV, o ponto e vírgula, a vírgula e o tab são detectados automaticamente, assim como a codificação UTF-8 ou Windows-1252.",
        },
        {
          q: "Como a planilha deve estar organizada?",
          a: "Uma linha por lançamento, com pelo menos uma coluna de data e uma de valor. A descrição é opcional, mas ajuda na conciliação. Se a primeira linha for o cabeçalho, a ferramenta sugere as colunas pelo nome (Data, Histórico, Valor).",
        },
        {
          q: "Quais formatos de data e valor funcionam?",
          a: "Datas como 31/01/2026, 31/01/26, 2026-01-31 e datas do Excel. Valores como 1.234,56, 1,234.56, R$ 1.234,56, (1.234,56) para negativo e com sufixo D ou C. O formato do número é detectado pela coluna inteira, e você pode escolher manualmente.",
        },
        {
          q: "Minha planilha tem débito e crédito em colunas separadas. Funciona?",
          a: "Sim. Troque a opção de valores para colunas separadas e indique a coluna de débito (vira saída) e a de crédito (vira entrada).",
        },
        {
          q: "O que acontece com linhas inválidas?",
          a: "Linhas em branco são ignoradas sem aviso. Linhas com data ou valor inválidos também ficam de fora do OFX, e a ferramenta mostra quantas foram e o número das primeiras, para você corrigir a planilha se quiser.",
        },
        {
          q: "O OFX gerado inclui o saldo da conta?",
          a: "Não. O arquivo traz os lançamentos, o período e os dados da conta que você informar. Confira a importação no seu sistema contábil antes de usar em produção.",
        },
        {
          q: "Minha planilha é enviada para algum servidor?",
          a: "Não. A leitura da planilha e a geração do OFX acontecem no seu navegador e o arquivo não passa pelos nossos servidores.",
        },
      ],
      keywords: ["converter planilha para ofx", "csv para ofx", "excel para ofx", "xlsx para ofx", "converter csv para ofx online grátis"],
      privacy:
        "A planilha é lida e convertida no seu navegador e não passa pelos nossos servidores. Você pode usar extratos de clientes sem expor o conteúdo a terceiros.",
    },
    "gerador-senhas": {
      shortName: "Gerador de senhas",
      title: "Gerador de senhas fortes e aleatórias online grátis",
      description:
        "Gere senhas fortes e aleatórias de 8 a 64 caracteres, com letras, números e símbolos. Grátis, sem cadastro, e a senha nunca sai do seu navegador.",
      h1: "Gerador de senhas fortes",
      intro:
        "Crie uma senha aleatória e forte em um clique: escolha o tamanho e os tipos de caractere. A senha é gerada no seu navegador e não é enviada nem guardada em lugar nenhum.",
      features: [
        "Tamanho de 8 a 64 caracteres, com letras maiúsculas, minúsculas, números e símbolos",
        "Aleatoriedade segura do navegador (crypto.getRandomValues), sem Math.random",
        "Opção para evitar caracteres parecidos, como O e 0 ou I e l",
        "Estimativa de força em bits de entropia",
        "A senha não é enviada nem armazenada: fica só na sua tela",
        "Gratuito e sem cadastro",
      ],
      faq: [
        {
          q: "Como gerar uma senha forte e aleatória?",
          a: "Ajuste o tamanho, marque os tipos de caractere e copie a senha. Para contas importantes, use 16 caracteres ou mais, com os quatro tipos, e uma senha diferente para cada serviço.",
        },
        {
          q: "A senha gerada é enviada ou salva em algum servidor?",
          a: "Não. Ela é criada no seu navegador e some quando você fecha ou recarrega a página. Nenhum valor de senha é enviado, e nós só contamos que a ferramenta foi usada, sem o conteúdo.",
        },
        {
          q: "Essa senha é realmente aleatória?",
          a: "Sim. O gerador usa a geração de números aleatórios criptograficamente segura do navegador e sorteia cada caractere sem viés. Garantimos pelo menos um caractere de cada tipo marcado.",
        },
        {
          q: "Qual o tamanho ideal de senha?",
          a: "Quanto maior, mais forte. Para a maioria das contas, 16 caracteres aleatórios já são difíceis de quebrar. A estimativa de força mostra a entropia em bits: acima de 80 bits é considerada muito forte.",
        },
        {
          q: "Como guardar tantas senhas?",
          a: "Use um gerenciador de senhas. Ele guarda cada senha única de forma criptografada e preenche os formulários por você.",
        },
        {
          q: "Posso usar para a senha do Wi-Fi?",
          a: "Pode. Para digitar com facilidade no celular, desmarque os símbolos e marque a opção de evitar caracteres parecidos, e use um tamanho maior para compensar.",
        },
      ],
      keywords: ["gerador de senhas", "gerador de senha forte", "gerar senha aleatória", "gerador de senhas online grátis"],
      privacy:
        "A senha é gerada no seu navegador com geração aleatória segura. Ela não é enviada, salva nem registrada: some quando você fecha a página.",
    },
    "gerador-qrcode": {
      shortName: "Gerador de QR Code",
      title: "Gerador de QR Code grátis: crie e baixe em PNG",
      description:
        "Crie QR Code de link ou texto na hora e baixe em PNG de alta resolução. Grátis, sem cadastro, sem validade, e o conteúdo não sai do seu navegador.",
      h1: "Gerador de QR Code grátis",
      intro:
        "Digite um link ou texto e o QR Code aparece na hora. Baixe em PNG nítido para imprimir ou compartilhar. O QR é gerado no seu navegador: o conteúdo não passa pelos nossos servidores.",
      features: [
        "QR Code instantâneo enquanto você digita",
        "Download em PNG de 512, 1024 ou 2048 pixels, com margem de segurança",
        "Escolha do nível de correção de erros (L, M, Q ou H)",
        "QR estático: o conteúdo fica gravado no próprio código, sem redirecionamento nem expiração",
        "Processamento 100% no navegador, sem enviar o conteúdo",
        "Gratuito e sem cadastro",
      ],
      faq: [
        {
          q: "Como gerar um QR Code grátis?",
          a: "Digite ou cole o link ou texto no campo. O QR Code é desenhado na hora e o botão Baixar PNG salva a imagem no seu computador.",
        },
        {
          q: "O QR Code expira?",
          a: "O QR em si não expira: ele é estático e guarda o conteúdo direto no desenho, sem passar por um serviço de redirecionamento. Se ele aponta para um link, o link ainda pode sair do ar, então confira se o destino continua válido.",
        },
        {
          q: "Posso gerar QR Code de Pix?",
          a: "Você pode colar o código Pix copia e cola gerado pelo seu banco e o QR vai representar exatamente esse texto. Não geramos nem validamos o Pix, então teste a leitura no app do seu banco antes de imprimir ou divulgar.",
        },
        {
          q: "Qual tamanho de PNG devo escolher?",
          a: "1024 pixels serve para a maioria dos usos. Use 2048 para impressão em tamanho grande e 512 para telas pequenas.",
        },
        {
          q: "O que é o nível de correção de erros?",
          a: "É quanto do QR pode estar sujo ou danificado e ainda ser lido. Níveis mais altos toleram mais dano, mas deixam o código mais denso e limitam o tamanho do texto.",
        },
        {
          q: "Posso mudar o destino depois de imprimir?",
          a: "Não. Como o QR é estático, o conteúdo não pode ser alterado depois. Se o destino mudar, é preciso gerar um novo QR Code.",
        },
        {
          q: "O conteúdo do meu QR Code é enviado para algum servidor?",
          a: "Não. O QR Code é gerado no seu navegador e o texto não passa pelos nossos servidores.",
        },
      ],
      keywords: ["gerador de qr code", "gerar qr code grátis", "qr code png", "gerador de qr code sem validade"],
      privacy: "O QR Code é gerado no seu navegador. O texto ou link que você digita não é enviado nem armazenado.",
    },
    "reparador-xml-merchant": {
      shortName: "Reparador de XML do Google Merchant",
      title: "Corrigir XML do Google Merchant Center: erros de feed e GTIN",
      description:
        "Valide e corrija o feed XML do Google Merchant Center: HTML nas descrições, preços fora do padrão e GTIN inválido que bloqueiam produtos no Google Shopping. Plano PRO.",
      h1: "Corrigir feed XML do Google Merchant Center",
      intro:
        "Produtos reprovados no Google Merchant Center por XML quebrado, HTML nas descrições ou GTIN inválido? Valide o feed, limpe o HTML e veja os GTINs com problema em um clique. Seu feed é tratado no navegador.",
      features: [
        "Valida o XML do feed e corrige preços fora do padrão, \"&\" soltos e IDs ausentes",
        "Remove o HTML das descrições e títulos",
        "Remove a máscara do GTIN e aponta os GTINs com dígito verificador inválido",
        "Aceita o arquivo XML ou a URL do feed",
        "Tratamento no navegador: o conteúdo do feed não passa pelos nossos servidores",
      ],
      faq: [
        {
          q: "O que causa erro no feed XML do Google Merchant Center?",
          a: "Os motivos mais comuns são XML mal formado, HTML solto nas descrições, preços fora do padrão e GTINs com máscara ou dígito verificador inválido.",
        },
        {
          q: "Como corrigir GTIN inválido no Google Merchant?",
          a: "O GTIN precisa ter 8, 12, 13 ou 14 dígitos e dígito verificador correto. A ferramenta remove máscaras (pontos e traços) automaticamente e aponta os GTINs com dígito verificador inválido, que você precisa conferir com o fabricante.",
        },
        {
          q: "O meu feed é enviado para os servidores do ResolveLabs?",
          a: "Não. O XML é tratado no seu navegador. Ao carregar por URL, quem busca o feed é o seu próprio navegador, então o servidor do feed precisa permitir o acesso (CORS).",
        },
        {
          q: "Essa ferramenta é gratuita?",
          a: "Ela faz parte do plano PRO ({price}), com {trialDays} dias grátis no início. Para só conferir a estrutura de um XML, use o visualizador de XML, que é gratuito.",
        },
      ],
      keywords: ["corrigir xml google merchant", "erro gtin google merchant", "google merchant center xml feed", "validar feed xml google shopping"],
      cta: {
        label: "Abrir o Reparador de XML",
        note: "Requer o plano PRO. Se ainda não tiver, você será levado para ver o plano.",
      },
    },
  },
};

export default { en, es, pt };
