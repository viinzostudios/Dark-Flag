import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <div class="bg">
        <div class="bg-floor"></div>
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="grid"></div>
      </div>

      <nav class="top-bar">
        <button class="back-btn" routerLink="/">
          <span class="back-arrow">←</span> Volver
        </button>
        <span class="brand">⚡ <strong>BUNKERTANK</strong></span>
        <span class="updated">Última actualización: 15 de mayo de 2026</span>
      </nav>

      <div class="scroll-area">
        <div class="doc">

          <div class="doc-header">
            <span class="doc-label">LEGAL</span>
            <h1 class="doc-title">Política de Privacidad</h1>
            <p class="doc-intro">
              <strong>VIINZO STUDIOS S.A.S.</strong>, sociedad constituida bajo las leyes de la República de Colombia,
              identificada con NIT 901.787.694-7, con domicilio en Calle 1C # 37-57, Bogotá D.C., Colombia
              (en adelante "VIINZO STUDIOS", "nosotros" o el "Responsable"), es responsable del tratamiento
              de los datos personales recopilados a través del sitio web y juego en línea <em>Bunkertank</em>,
              accesible en <strong>https://bunkertank.io</strong>.
            </p>
            <p class="doc-intro">
              Esta Política explica cómo recopilamos, usamos, almacenamos, transferimos y protegemos tu información
              personal, en cumplimiento de la Ley 1581 de 2012 (Colombia), el RGPD (UE) 2016/679, la CCPA/CPRA
              (California), COPPA y demás normativas aplicables.
            </p>
          </div>

          <section class="section">
            <h2 class="sec-title"><span class="sec-num">1</span> Información que recopilamos</h2>

            <h3 class="sub-title">1.1 Información que tú proporcionas</h3>
            <ul class="list">
              <li><strong>Datos de cuenta:</strong> nombre de usuario, dirección de correo electrónico, contraseña (almacenada cifrada).</li>
              <li><strong>Datos de perfil:</strong> avatar, país (opcional), preferencias de juego.</li>
              <li><strong>Datos de pago:</strong> cuando realizas una compra, los datos de tu tarjeta o método de pago son procesados directamente por nuestro proveedor de pagos <em>Lemon Squeezy</em>. VIINZO STUDIOS <strong>NO</strong> almacena datos completos de tarjetas de crédito en sus servidores.</li>
              <li><strong>Comunicaciones:</strong> mensajes que nos envíes a través de soporte (<a href="mailto:soporte&#64;bunkertank.io">soporte&#64;bunkertank.io</a>) o canales oficiales.</li>
            </ul>

            <h3 class="sub-title">1.2 Información recopilada automáticamente</h3>
            <ul class="list">
              <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo, identificador de dispositivo, idioma, zona horaria.</li>
              <li><strong>Datos de uso del juego:</strong> partidas jugadas, estadísticas de rendimiento, skins adquiridas, progresión, tiempo de sesión.</li>
              <li><strong>Cookies y tecnologías similares:</strong> consulta nuestra Política de Cookies.</li>
              <li><strong>Datos publicitarios:</strong> cuando visualizas anuncios de Google AdSense u otras redes publicitarias.</li>
            </ul>

            <h3 class="sub-title">1.3 Información de terceros</h3>
            <p class="text">
              Si eliges iniciar sesión mediante servicios de terceros (Google, Discord, etc.), recibimos los datos básicos
              que esos servicios comparten con nosotros según sus propias políticas.
            </p>
          </section>

          <section class="section">
            <h2 class="sec-title"><span class="sec-num">2</span> Finalidad del tratamiento</h2>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr><th>Finalidad</th><th>Base legal</th></tr>
                </thead>
                <tbody>
                  <tr><td>Crear y gestionar tu cuenta de jugador</td><td>Ejecución del contrato</td></tr>
                  <tr><td>Procesar compras de moneda premium, skins y otros productos</td><td>Ejecución del contrato</td></tr>
                  <tr><td>Mantener la funcionalidad del juego (matchmaking, ranking, partidas)</td><td>Ejecución del contrato</td></tr>
                  <tr><td>Enviar comunicaciones transaccionales (recibos, notificaciones de seguridad)</td><td>Ejecución del contrato</td></tr>
                  <tr><td>Prevenir fraude, hackeo, cheats y abuso</td><td>Interés legítimo</td></tr>
                  <tr><td>Mostrar publicidad relevante (con tu consentimiento)</td><td>Consentimiento</td></tr>
                  <tr><td>Mejorar el servicio mediante analíticas agregadas</td><td>Interés legítimo</td></tr>
                  <tr><td>Cumplir obligaciones legales (fiscal, judicial)</td><td>Obligación legal</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="section">
            <h2 class="sec-title"><span class="sec-num">3</span> Menores de edad</h2>
            <p class="text">El Servicio está destinado a personas mayores de 13 años. No recopilamos conscientemente datos personales de menores de 13 años. Si descubrimos que hemos recopilado datos de un menor de 13 sin consentimiento parental verificable, eliminaremos dicha información de inmediato.</p>
            <p class="text">Si eres menor de 18 años, debes contar con la autorización de tus padres o tutores legales para usar el Servicio.</p>
            <p class="text">Si eres padre/madre o tutor y crees que tu hijo/a ha proporcionado datos personales sin tu autorización, contáctanos en <a href="mailto:legal@bunkertank.io">legal&#64;bunkertank.io</a>.</p>
          </section>

          <section class="section">
            <h2 class="sec-title"><span class="sec-num">4</span> Compartir información con terceros</h2>
            <p class="text">VIINZO STUDIOS <strong>NO vende</strong> tus datos personales. Compartimos información únicamente con los siguientes encargados del tratamiento:</p>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr><th>Tercero</th><th>Finalidad</th><th>Ubicación</th></tr>
                </thead>
                <tbody>
                  <tr><td>Lemon Squeezy</td><td>Procesamiento de pagos</td><td>EE.UU. / UE</td></tr>
                  <tr><td>Cloudflare</td><td>CDN, DNS, seguridad, enrutamiento de correo</td><td>Global</td></tr>
                  <tr><td>Google (Analytics, AdSense)</td><td>Analítica y publicidad</td><td>EE.UU. / UE</td></tr>
                  <tr><td>Proveedor de hosting</td><td>Infraestructura del juego</td><td>Por definir</td></tr>
                  <tr><td>Proveedor de email transaccional (Resend / Mailgun)</td><td>Envío de notificaciones</td><td>EE.UU. / UE</td></tr>
                </tbody>
              </table>
            </div>
            <p class="text">También podemos compartir información si: lo requiere una autoridad judicial o administrativa competente; es necesario para proteger derechos, propiedad o seguridad de VIINZO STUDIOS, jugadores o terceros; o si ocurre una fusión, adquisición o venta de activos.</p>
          </section>

          <section class="section">
            <h2 class="sec-title"><span class="sec-num">5</span> Transferencias internacionales</h2>
            <p class="text">Algunos de nuestros encargados del tratamiento se ubican fuera de Colombia. Cuando transferimos datos al exterior, garantizamos un nivel de protección adecuado mediante:</p>
            <ul class="list">
              <li>Cláusulas contractuales tipo aprobadas por la Superintendencia de Industria y Comercio (SIC).</li>
              <li>Decisiones de adecuación de la Comisión Europea, cuando aplique.</li>
              <li>Marcos como el EU-US Data Privacy Framework, cuando aplique.</li>
            </ul>
          </section>

          <section class="section">
            <h2 class="sec-title"><span class="sec-num">6</span> Tus derechos</h2>

            <h3 class="sub-title">6.1 Derechos bajo la Ley 1581 de 2012 (Colombia)</h3>
            <ul class="list">
              <li>Conocer, actualizar y rectificar tus datos personales.</li>
              <li>Solicitar prueba de la autorización otorgada al Responsable.</li>
              <li>Ser informado sobre el uso de tus datos.</li>
              <li>Presentar quejas ante la SIC por infracciones legales.</li>
              <li>Revocar la autorización y/o solicitar la supresión de tus datos cuando no se respeten los principios, derechos y garantías constitucionales y legales.</li>
              <li>Acceder gratuitamente a tus datos personales.</li>
            </ul>

            <h3 class="sub-title">6.2 Derechos bajo el RGPD (UE)</h3>
            <ul class="list">
              <li>Portabilidad de tus datos en formato estructurado.</li>
              <li>Oponerte al tratamiento basado en interés legítimo.</li>
              <li>Restringir el tratamiento.</li>
              <li>Decisiones automatizadas: derecho a no ser objeto de decisiones basadas únicamente en tratamiento automatizado, incluida la elaboración de perfiles.</li>
            </ul>

            <h3 class="sub-title">6.3 Derechos bajo CCPA/CPRA (California)</h3>
            <ul class="list">
              <li>Saber qué información personal recopilamos sobre ti.</li>
              <li>Solicitar la eliminación de tu información personal.</li>
              <li>Optar por no participar en la venta o el intercambio de tu información personal.</li>
              <li>No ser discriminado/a por ejercer tus derechos.</li>
            </ul>
            <p class="text">VIINZO STUDIOS declara expresamente que <strong>NO vende</strong> información personal de sus usuarios.</p>

            <h3 class="sub-title">6.4 Cómo ejercer tus derechos</h3>
            <p class="text">Para ejercer cualquiera de estos derechos, envía una solicitud a <a href="mailto:legal@bunkertank.io">legal&#64;bunkertank.io</a> indicando: nombre completo y documento de identidad, correo electrónico asociado a tu cuenta de Bunkertank, y el derecho que deseas ejercer con descripción detallada.</p>
            <p class="text">Responderemos en un máximo de 15 días hábiles (Colombia) o 30 días calendario (RGPD/CCPA), según corresponda.</p>
          </section>

          <section class="section">
            <h2 class="sec-title"><span class="sec-num">7</span> Período de retención</h2>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr><th>Categoría</th><th>Período de retención</th></tr>
                </thead>
                <tbody>
                  <tr><td>Datos de cuenta activa</td><td>Mientras la cuenta exista</td></tr>
                  <tr><td>Datos de cuenta inactiva (&gt;2 años sin login)</td><td>Eliminación tras 24 meses adicionales</td></tr>
                  <tr><td>Datos de transacciones (facturas, recibos)</td><td>10 años (obligación fiscal colombiana)</td></tr>
                  <tr><td>Registros técnicos y de seguridad</td><td>12 meses</td></tr>
                  <tr><td>Datos analíticos agregados (anonimizados)</td><td>Indefinido</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="section">
            <h2 class="sec-title"><span class="sec-num">8</span> Seguridad de la información</h2>
            <p class="text">Implementamos medidas técnicas, administrativas y físicas razonables para proteger tus datos:</p>
            <ul class="list">
              <li>Cifrado de contraseñas con algoritmos modernos (bcrypt o Argon2).</li>
              <li>Cifrado en tránsito mediante TLS 1.2 o superior.</li>
              <li>Controles de acceso basados en roles.</li>
              <li>Auditorías de seguridad periódicas.</li>
              <li>Sistemas de prevención de intrusiones y cortafuegos.</li>
            </ul>
            <p class="text">Sin embargo, ningún sistema es 100% invulnerable. En caso de una brecha de seguridad que afecte tus datos, te notificaremos en un máximo de 72 horas desde su detección, conforme al RGPD y la Circular SIC correspondiente.</p>
          </section>

          <section class="section">
            <h2 class="sec-title"><span class="sec-num">9</span> Cookies y tecnologías similares</h2>
            <p class="text">Usamos cookies para autenticación, funcionalidad del juego, analíticas y publicidad. Para más detalles, consulta nuestra Política de Cookies.</p>
          </section>

          <section class="section">
            <h2 class="sec-title"><span class="sec-num">10</span> Cambios en esta Política</h2>
            <p class="text">Podemos actualizar esta Política de Privacidad periódicamente. Los cambios materiales serán notificados a los usuarios registrados con al menos 30 días de antelación mediante correo electrónico o aviso destacado en el Servicio.</p>
            <p class="text">La fecha de la última actualización figura al inicio de este documento. El uso continuado del Servicio tras la entrada en vigor de los cambios constituye aceptación de los mismos.</p>
          </section>

          <section class="section">
            <h2 class="sec-title"><span class="sec-num">11</span> Contacto</h2>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr><th>Canal</th><th>Detalle</th></tr>
                </thead>
                <tbody>
                  <tr><td>Email legal</td><td><a href="mailto:legal@bunkertank.io">legal&#64;bunkertank.io</a></td></tr>
                  <tr><td>Email general</td><td><a href="mailto:hola@bunkertank.io">hola&#64;bunkertank.io</a></td></tr>
                  <tr><td>Dirección postal</td><td>VIINZO STUDIOS S.A.S. – Calle 1C # 37-57, Bogotá D.C., Colombia</td></tr>
                  <tr><td>NIT</td><td>901.787.694-7</td></tr>
                </tbody>
              </table>
            </div>
            <div class="authority-box">
              <span class="authority-label">Autoridad de supervisión en Colombia</span>
              <span class="authority-name">Superintendencia de Industria y Comercio (SIC)</span>
              <a href="https://www.sic.gov.co" target="_blank" rel="noopener noreferrer" class="authority-link">www.sic.gov.co</a>
            </div>
          </section>

        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .page {
      position: relative;
      width: 100vw; height: 100vh;
      overflow: hidden;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      color: var(--t-tx, #e8e8e8);
    }

    /* Background */
    .bg { position: absolute; inset: 0; background: var(--t-bg, #0d0d12); z-index: 0; }
    .bg-floor {
      position: absolute; inset: 0;
      background: url('/assets/environment/bg-floor-tile.png') repeat center;
      background-size: 80px 80px;
      opacity: var(--t-floor-op, .04);
    }
    .blob { position: absolute; border-radius: 50%; filter: blur(120px); }
    .b1 {
      width: 60vw; height: 60vw; max-width: 760px; max-height: 760px;
      background: var(--t-b1, #3B2AFF); opacity: .06;
      top: -30%; left: -20%;
    }
    .b2 {
      width: 44vw; height: 44vw; max-width: 540px; max-height: 540px;
      background: var(--t-b2, #FF3B6E); opacity: .04;
      bottom: 5%; right: -10%;
    }
    .grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(var(--t-grid, rgba(255,255,255,.03)) 1px, transparent 1px),
        linear-gradient(90deg, var(--t-grid, rgba(255,255,255,.03)) 1px, transparent 1px);
      background-size: 60px 60px;
    }

    /* Top bar */
    .top-bar {
      position: relative; z-index: 20;
      flex-shrink: 0;
      display: flex; align-items: center; gap: 16px;
      padding: 16px 48px;
      border-bottom: 1px solid var(--t-bd, rgba(255,255,255,.07));
      background: var(--t-surface, rgba(255,255,255,.03));
    }
    .back-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: 8px;
      background: var(--t-ghost-bg, rgba(255,255,255,.06));
      border: 1px solid var(--t-ghost-bd, rgba(255,255,255,.10));
      color: var(--t-ghost-tx, #ccc);
      font-size: 12px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      transition: background .15s;
      flex-shrink: 0;
    }
    .back-btn:hover { background: var(--t-ghost-bg-h, rgba(255,255,255,.10)); }
    .back-arrow { font-size: 14px; }

    .brand {
      font-size: 11px; font-weight: 800; letter-spacing: 2px;
      color: var(--t-tx3, #aaa); text-transform: uppercase;
      flex: 1;
    }
    .updated {
      font-size: 11px; color: var(--t-tx6, #666);
      flex-shrink: 0;
    }

    /* Scroll container */
    .scroll-area {
      position: relative; z-index: 10;
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 48px 0 64px;
      scrollbar-width: thin;
      scrollbar-color: var(--t-bd, rgba(255,255,255,.12)) transparent;
    }
    .scroll-area::-webkit-scrollbar { width: 6px; }
    .scroll-area::-webkit-scrollbar-thumb {
      background: var(--t-bd, rgba(255,255,255,.12));
      border-radius: 3px;
    }

    /* Document */
    .doc {
      max-width: 780px;
      margin: 0 auto;
      padding: 0 32px;
    }

    .doc-header {
      margin-bottom: 48px;
      padding-bottom: 36px;
      border-bottom: 1px solid var(--t-bd, rgba(255,255,255,.07));
    }
    .doc-label {
      display: inline-block;
      font-size: 10px; font-weight: 700; letter-spacing: .2em;
      text-transform: uppercase;
      color: var(--t-accent, #5B6AF7);
      margin-bottom: 12px;
    }
    .doc-title {
      font-size: clamp(28px, 4vw, 44px);
      font-weight: 900; line-height: 1;
      letter-spacing: -.02em;
      background: var(--t-title-grad, linear-gradient(135deg, #fff 0%, #888 100%));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0 0 20px;
    }
    .doc-intro {
      font-size: 14px; line-height: 1.7;
      color: var(--t-tx4, #999);
      margin: 0 0 12px;
    }
    .doc-intro:last-child { margin-bottom: 0; }

    /* Sections */
    .section {
      margin-bottom: 40px;
      padding-bottom: 40px;
      border-bottom: 1px solid var(--t-bd, rgba(255,255,255,.05));
    }
    .section:last-child { border-bottom: none; margin-bottom: 0; }

    .sec-title {
      display: flex; align-items: center; gap: 12px;
      font-size: 18px; font-weight: 800;
      color: var(--t-tx, #e8e8e8);
      margin: 0 0 20px;
    }
    .sec-num {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 8px;
      background: var(--t-accent-bg, rgba(91,106,247,.12));
      border: 1px solid var(--t-accent-bd2, rgba(91,106,247,.25));
      color: var(--t-accent, #5B6AF7);
      font-size: 12px; font-weight: 900;
      flex-shrink: 0;
    }

    .sub-title {
      font-size: 13px; font-weight: 700; letter-spacing: .04em;
      text-transform: uppercase;
      color: var(--t-tx3, #aaa);
      margin: 20px 0 10px;
    }

    .text {
      font-size: 14px; line-height: 1.75;
      color: var(--t-tx4, #999);
      margin: 0 0 12px;
    }
    .text:last-child { margin-bottom: 0; }

    .list {
      list-style: none; padding: 0; margin: 0 0 12px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .list li {
      font-size: 14px; line-height: 1.7;
      color: var(--t-tx4, #999);
      padding-left: 20px;
      position: relative;
    }
    .list li::before {
      content: '–';
      position: absolute; left: 0;
      color: var(--t-accent, #5B6AF7);
      font-weight: 700;
    }

    a {
      color: var(--t-accent, #5B6AF7);
      text-decoration: none;
    }
    a:hover { text-decoration: underline; }

    /* Tables */
    .table-wrap {
      overflow-x: auto;
      margin: 0 0 12px;
      border-radius: 10px;
      border: 1px solid var(--t-bd, rgba(255,255,255,.07));
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .data-table th {
      padding: 10px 16px;
      text-align: left;
      font-size: 10px; font-weight: 700; letter-spacing: .12em;
      text-transform: uppercase;
      color: var(--t-tx5, #888);
      background: var(--t-surface, rgba(255,255,255,.03));
      border-bottom: 1px solid var(--t-bd, rgba(255,255,255,.07));
    }
    .data-table td {
      padding: 10px 16px;
      color: var(--t-tx4, #999);
      border-bottom: 1px solid var(--t-bd, rgba(255,255,255,.04));
      line-height: 1.5;
    }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: rgba(255,255,255,.02); }

    /* Authority box */
    .authority-box {
      display: flex; flex-direction: column; gap: 4px;
      margin-top: 16px; padding: 16px 20px;
      border-radius: 10px;
      background: var(--t-surface, rgba(255,255,255,.03));
      border: 1px solid var(--t-bd, rgba(255,255,255,.07));
    }
    .authority-label {
      font-size: 10px; font-weight: 700; letter-spacing: .12em;
      text-transform: uppercase; color: var(--t-tx5, #888);
    }
    .authority-name {
      font-size: 14px; font-weight: 600; color: var(--t-tx, #e8e8e8);
    }
    .authority-link { font-size: 13px; }

    /* Responsive */
    @media (max-width: 640px) {
      .top-bar { padding: 14px 20px; }
      .updated { display: none; }
      .doc { padding: 0 20px; }
      .scroll-area { padding: 32px 0 48px; }
    }
  `]
})
export class PrivacyPolicyComponent {}
