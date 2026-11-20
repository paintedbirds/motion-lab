import {useSyncExternalStore} from 'react'
import {Link} from 'react-router-dom'
import {Logo} from '@/components/logo'
import {LangSwitch} from '@/components/lang-switch'
import {getLang, subscribeLang} from '@/i18n'

// Written in both languages here and chosen by the language switch, so the page does not depend on the translator.
// What it says must stay true: if a feature ever sends images or data to a server, update both pages first.
const UPDATED = '2026-11-20'
const SITE = 'https://paintedbirds.xyz/?utm_source=motion-lab&utm_medium=referral&utm_campaign=legal'

type Block = {h: string; p: string[]}
type Doc = {title: string; intro: string; updated: string; blocks: Block[]; back: string; contact: string}

const privacy: Record<'es' | 'en', Doc> = {
  es: {
    title: 'Política de privacidad', updated: 'Última actualización', back: 'Volver a Motion Lab', contact: 'Contacto',
    intro: 'Motion Lab no guarda tus imágenes ni tus datos en nuestros servidores. Todo lo que hacés en el editor ocurre en tu navegador.',
    blocks: [
      {h: 'Qué procesamos y dónde', p: ['Las imágenes que subís, los ajustes y el video que generás se procesan dentro de tu navegador, en tu equipo. No se envían a Motion Lab ni a Painted Birds.', 'No hay cuentas ni registro. No te pedimos nombre, correo ni ningún otro dato personal.']},
      {h: 'Qué se guarda en tu dispositivo', p: ['Para que no pierdas tu trabajo al cerrar la pestaña, el editor guarda tu proyecto (imágenes y ajustes) en el almacenamiento del navegador (IndexedDB), y tu idioma elegido en el almacenamiento local. Esos datos quedan solo en tu equipo.', 'Podés borrarlos cuando quieras con "Empezar de cero" en el menú Proyecto, o borrando los datos del sitio desde la configuración de tu navegador.']},
      {h: 'Lo que no hacemos', p: ['No vendemos ni compartimos datos. No usamos cookies de seguimiento, publicidad ni herramientas de analítica en esta aplicación.']},
      {h: 'Alojamiento', p: ['El sitio se sirve desde un proveedor de alojamiento. Como cualquier servidor web, ese proveedor puede registrar datos técnicos de la visita, como la dirección IP, el navegador y la fecha, para operar y proteger el servicio. Esos registros se rigen por la política de privacidad del proveedor.']},
      {h: 'Enlaces a otros sitios', p: ['El pie de página enlaza a paintedbirds.xyz, con parámetros que indican que llegaste desde Motion Lab. Si hacés clic, ese sitio recibe esa información y se rige por su propia política.']},
      {h: 'Cambios', p: ['Si algún día agregamos una función que envíe datos fuera de tu navegador, por ejemplo exportar en un servidor, actualizaremos esta página antes de lanzarla y lo avisaremos en el editor.']},
    ],
  },
  en: {
    title: 'Privacy policy', updated: 'Last updated', back: 'Back to Motion Lab', contact: 'Contact',
    intro: 'Motion Lab does not store your images or your data on our servers. Everything you do in the editor happens in your browser.',
    blocks: [
      {h: 'What we process and where', p: ['The images you upload, your settings and the video you generate are processed inside your browser, on your device. They are not sent to Motion Lab or to Painted Birds.', 'There are no accounts or sign-ups. We do not ask for your name, email or any other personal data.']},
      {h: 'What is stored on your device', p: ['So you do not lose your work when you close the tab, the editor saves your project (images and settings) in the browser\'s storage (IndexedDB), and your chosen language in local storage. That data stays on your device only.', 'You can delete it any time with "Start over" in the Project menu, or by clearing the site\'s data in your browser settings.']},
      {h: 'What we do not do', p: ['We do not sell or share data. We do not use tracking cookies, advertising or analytics tools in this application.']},
      {h: 'Hosting', p: ['The site is served by a hosting provider. Like any web server, that provider may log technical data about the visit, such as the IP address, browser and date, to operate and protect the service. Those logs are governed by the provider\'s privacy policy.']},
      {h: 'Links to other sites', p: ['The footer links to paintedbirds.xyz, with parameters showing that you came from Motion Lab. If you click, that site receives that information and is governed by its own policy.']},
      {h: 'Changes', p: ['If we ever add a feature that sends data outside your browser, for example exporting on a server, we will update this page before launching it and tell you in the editor.']},
    ],
  },
}

const terms: Record<'es' | 'en', Doc> = {
  es: {
    title: 'Términos de uso', updated: 'Última actualización', back: 'Volver a Motion Lab', contact: 'Contacto',
    intro: 'Al usar Motion Lab aceptás estos términos. Si no estás de acuerdo, no uses la herramienta.',
    blocks: [
      {h: 'El servicio', p: ['Motion Lab es una herramienta para armar videos animados a partir de tus imágenes. Se ofrece tal cual y según disponibilidad, y puede cambiar, interrumpirse o retirarse en cualquier momento.']},
      {h: 'Tu contenido', p: ['Vos sos responsable de las imágenes que usás. Al usarlas declarás que tenés los derechos para hacerlo y que no infringen derechos de terceros, no son ilegales y no incluyen datos personales de otras personas sin su permiso.', 'Tus imágenes no llegan a nuestros servidores, así que no las revisamos ni las controlamos. No reclamamos ningún derecho sobre las imágenes ni sobre los videos que creás: son tuyos.']},
      {h: 'Imágenes de ejemplo', p: ['Las imágenes de ejemplo que trae el editor sirven para probar la herramienta.']},
      {h: 'Datos guardados en tu navegador', p: ['Tu proyecto se guarda en el navegador y puede perderse: por limpieza de datos, modo privado, falta de espacio o cambio de equipo. Guardá tus propias copias de las imágenes y usá "Guardar en un archivo" para respaldar el proyecto.']},
      {h: 'Sin garantías', p: ['No garantizamos que el servicio esté siempre disponible, que no tenga errores, que funcione igual en todos los navegadores ni que el resultado sirva para un fin particular. La calidad del video depende de tus imágenes, de tus ajustes y de tu navegador.']},
      {h: 'Límite de responsabilidad', p: ['En la medida que la ley lo permita, Painted Birds no responde por pérdidas indirectas, pérdida de datos, pérdida de ingresos ni por el uso que hagas de los videos que generes.']},
      {h: 'Uso aceptable', p: ['No uses Motion Lab para fines ilegales, para infringir derechos de terceros ni para dañar o sobrecargar el servicio.']},
      {h: 'Propiedad', p: ['El nombre, el logo, el diseño y el código de Motion Lab pertenecen a Painted Birds. Los componentes de terceros se usan bajo sus propias licencias.']},
      {h: 'Cambios', p: ['Podemos actualizar estos términos. La versión vigente es la publicada en esta página. Seguir usando la herramienta después de un cambio implica aceptarlo.']},
    ],
  },
  en: {
    title: 'Terms of use', updated: 'Last updated', back: 'Back to Motion Lab', contact: 'Contact',
    intro: 'By using Motion Lab you accept these terms. If you do not agree, do not use the tool.',
    blocks: [
      {h: 'The service', p: ['Motion Lab is a tool for making animated videos from your images. It is provided as is and as available, and may change, be interrupted or be withdrawn at any time.']},
      {h: 'Your content', p: ['You are responsible for the images you use. By using them you state that you have the right to do so and that they do not infringe third-party rights, are not unlawful, and do not include other people\'s personal data without their permission.', 'Your images do not reach our servers, so we do not review or control them. We claim no rights over your images or the videos you create: they are yours.']},
      {h: 'Example images', p: ['The example images that come with the editor are there to try the tool.']},
      {h: 'Data stored in your browser', p: ['Your project is saved in the browser and can be lost: by clearing data, private mode, lack of space or switching devices. Keep your own copies of your images and use "Save to a file" to back up the project.']},
      {h: 'No warranties', p: ['We do not guarantee that the service will always be available, error-free, behave the same in every browser, or fit a particular purpose. Video quality depends on your images, your settings and your browser.']},
      {h: 'Limit of liability', p: ['To the extent the law allows, Painted Birds is not liable for indirect losses, loss of data, loss of income, or for how you use the videos you generate.']},
      {h: 'Acceptable use', p: ['Do not use Motion Lab for unlawful purposes, to infringe third-party rights, or to harm or overload the service.']},
      {h: 'Ownership', p: ['The Motion Lab name, logo, design and code belong to Painted Birds. Third-party components are used under their own licenses.']},
      {h: 'Changes', p: ['We may update these terms. The current version is the one published on this page. Continuing to use the tool after a change means you accept it.']},
    ],
  },
}

function Page({docs}: {docs: Record<'es' | 'en', Doc>}) {
  const lang = useSyncExternalStore(subscribeLang, getLang)
  const d = docs[lang]
  return (
    <div className="mx-auto w-full max-w-[720px] px-[clamp(16px,4vw,32px)]">
      <header className="flex h-16 items-center justify-between">
        <Link to="/" aria-label="Motion Lab"><Logo className="text-xl" /></Link>
        <LangSwitch />
      </header>
      <main className="pb-24 pt-10">
        <h1 className="text-balance text-[clamp(2rem,4.4vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">{d.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{d.updated}: {UPDATED}</p>
        <p className="mt-8 text-lg leading-relaxed">{d.intro}</p>
        {d.blocks.map(b => (
          <section key={b.h} className="mt-10">
            <h2 className="text-xl font-medium tracking-[-0.02em]">{b.h}</h2>
            {b.p.map(t => <p key={t} className="mt-3 leading-relaxed text-muted-foreground">{t}</p>)}
          </section>
        ))}
        <section className="mt-10">
          <h2 className="text-xl font-medium tracking-[-0.02em]">{d.contact}</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground"><a href={SITE} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground">paintedbirds.xyz</a></p>
        </section>
        <p className="mt-12 text-sm"><Link to="/" className="underline underline-offset-4">{d.back}</Link></p>
      </main>
    </div>
  )
}

export const Privacy = () => <Page docs={privacy} />
export const Terms = () => <Page docs={terms} />
