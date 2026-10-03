// Títulos, descrições e metadados das páginas de ferramenta que não vêm do dicionário de SEO.
import type { Shape } from "../types";

const en = {
  inspector: {
    metaTitle: "Universal file inspector",
    metaDescription:
      "Open spreadsheets, OFX, XML, JSON, PDF and images in your browser and see the content and metadata. The file never goes through our servers.",
    breadcrumbGroup: "General tools",
    breadcrumb: "Universal file inspector",
    title: "Universal file inspector",
    description:
      "Open spreadsheets (XLSX, XLS, CSV), OFX statements, XML, JSON, PDF and images and see the content and technical metadata. Everything is read in your browser, without sending anything to a server.",
  },
  mock: {
    metaTitle: "Brazilian test data generator",
    metaDescription:
      "Generate JSON with valid CPFs, CNPJs, postal codes (CEP) and PIX keys to populate databases and test pipelines. All in your browser.",
    breadcrumb: "Brazilian data generator",
    title: "Brazilian mock data generator",
    description: "Generate JSON arrays with valid CPFs, CNPJs, postal codes (CEP) and PIX keys to populate databases and test pipelines.",
  },
  pdfToOfx: {
    metaTitle: "PDF to OFX",
    breadcrumb: "PDF to OFX converter",
    title: "PDF statement to OFX converter",
    description:
      "Automate bank reconciliation in your accounting system. 100% secure processing in your browser, with no data sent to servers.",
  },
  images: {
    metaTitle: "Batch image processor",
    breadcrumb: "Batch image processor",
    title: "Batch optimizer and watermark",
    description: "Resize, compress to WebP and apply your logo to up to 100 images at once. All in your browser, with no slowdown.",
  },
  xml: {
    metaTitle: "Merchant XML fixer",
    breadcrumb: "Merchant XML fixer",
    title: "Automatic XML fixer for Google Merchant",
    description:
      "Validate, clean broken HTML tags and fix GTIN errors in your product feed in one click to avoid blocks in Google Ads.",
  },
};

export type ToolPagesMessages = Shape<typeof en>;

const es: ToolPagesMessages = {
  inspector: {
    metaTitle: "Inspector universal de archivos",
    metaDescription:
      "Abre hojas de cálculo, OFX, XML, JSON, PDF e imágenes en el navegador y mira el contenido y los metadatos. El archivo no pasa por nuestros servidores.",
    breadcrumbGroup: "Herramientas generales",
    breadcrumb: "Inspector universal de archivos",
    title: "Inspector universal de archivos",
    description:
      "Abre hojas de cálculo (XLSX, XLS, CSV), extractos OFX, XML, JSON, PDF e imágenes y mira el contenido y los metadatos técnicos. Todo se lee en tu navegador, sin enviar nada a un servidor.",
  },
  mock: {
    metaTitle: "Generador de datos de prueba de Brasil",
    metaDescription:
      "Genera JSON con CPF, CNPJ, códigos postales (CEP) válidos y claves PIX para poblar bases de datos y probar pipelines. Todo en el navegador.",
    breadcrumb: "Generador de datos de Brasil",
    title: "Generador de datos de prueba de Brasil",
    description: "Genera arrays JSON con CPF, CNPJ, códigos postales (CEP) válidos y claves PIX para poblar bases de datos y probar pipelines.",
  },
  pdfToOfx: {
    metaTitle: "PDF a OFX",
    breadcrumb: "Conversor de PDF a OFX",
    title: "Conversor de extracto PDF a OFX",
    description:
      "Automatiza la conciliación bancaria de tu sistema contable. Procesamiento 100% seguro en tu navegador, sin envío de datos a servidores.",
  },
  images: {
    metaTitle: "Procesador de imágenes por lotes",
    breadcrumb: "Procesador de imágenes por lotes",
    title: "Optimizador y marca de agua por lotes",
    description: "Redimensiona, comprime a WebP y aplica tu logo en hasta 100 imágenes a la vez. Todo en tu navegador, sin lentitud.",
  },
  xml: {
    metaTitle: "Reparador de XML de Merchant",
    breadcrumb: "Reparador de XML de Merchant",
    title: "Reparador automático de XML para Google Merchant",
    description:
      "Valida, limpia etiquetas HTML rotas y corrige errores de GTIN de tu feed de productos en un clic para evitar bloqueos en Google Ads.",
  },
};

const pt: ToolPagesMessages = {
  inspector: {
    metaTitle: "Inspetor Universal de Arquivos",
    metaDescription:
      "Abra planilhas, OFX, XML, JSON, PDF e imagens no navegador e veja o conteúdo e os metadados. O arquivo não passa pelos nossos servidores.",
    breadcrumbGroup: "Ferramentas Gerais",
    breadcrumb: "Inspetor Universal de Arquivos",
    title: "Inspetor Universal de Arquivos",
    description:
      "Abra planilhas (XLSX, XLS, CSV), extratos OFX, XML, JSON, PDF e imagens e veja o conteúdo e os metadados técnicos. Tudo é lido no seu navegador, sem enviar nada a servidor.",
  },
  mock: {
    metaTitle: "Gerador de Mock Data BR",
    metaDescription:
      "Gere JSON com CPFs, CNPJs, CEPs válidos e chaves PIX para popular bancos de dados e testar pipelines. Tudo no navegador.",
    breadcrumb: "Gerador de Dados BR",
    title: "Gerador de Mock Data Brasileiro",
    description: "Gere arrays JSON com CPFs, CNPJs, CEPs válidos e chaves PIX para popular bancos de dados e testar pipelines.",
  },
  pdfToOfx: {
    metaTitle: "PDF para OFX",
    breadcrumb: "Conversor PDF para OFX",
    title: "Conversor de Extrato PDF para OFX",
    description:
      "Automatize a conciliação bancária do seu sistema contábil. Processamento 100% seguro no seu navegador, sem envio de dados para servidores.",
  },
  images: {
    metaTitle: "Processador de Imagens em Lote",
    breadcrumb: "Processador de Imagens em Lote",
    title: "Otimizador e Marca D'água em Lote",
    description: "Redimensione, comprima para WebP e aplique sua logo em até 100 imagens simultaneamente. Tudo no seu navegador, sem lentidão.",
  },
  xml: {
    metaTitle: "Reparador de XML Merchant",
    breadcrumb: "Reparador de XML Merchant",
    title: "Reparador Automático de XML para Google Merchant",
    description:
      "Valide, limpe tags HTML quebradas e corrija erros de GTIN do seu feed de produtos em um clique para evitar bloqueios no Google Ads.",
  },
};

export default { en, es, pt };
