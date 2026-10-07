


"use strict";
portfolioProjects.forEach(project => {
  if (project.gallery) project.gallery = project.gallery.map(url => url === "@cover" ? project.image : url);
});
const grid = document.querySelector("#project-grid");
const dialog = document.querySelector("#project-dialog");
let lastTrigger = null;

function node(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function validLink(value) {
  if (!value) return false;
  if (/^https:\/\//i.test(value)) return true;
  if (value.startsWith("blob:") && new URL(value).origin === location.origin) return true;
  return /^(assets|downloads)\/[a-z0-9_./-]+$/i.test(value) && !value.includes("..");
}

function addLink(container, text, url, downloadName) {
  if (!validLink(url)) return;
  const link = node("a", "button secondary", text);
  link.href = url;
  if (downloadName) { link.download = downloadName; }
  else if (url.startsWith("https://") || url.startsWith("blob:")) { link.target = "_blank"; link.rel = "noopener noreferrer"; }
  container.append(link);
}

function screenshotViewport(source, crop, label) {
  const viewport = node("div", "screenshot-viewport");
  viewport.style.aspectRatio = `${crop.width} / ${crop.height}`;
  const image = node("img"); image.src = source; image.alt = label; image.loading = "lazy";
  image.style.width = `${1536 / crop.width * 100}%`;
  image.style.left = `${-crop.x / crop.width * 100}%`;
  image.style.top = `${-crop.y / crop.height * 100}%`;
  viewport.append(image);
  return viewport;
}

function openProject(project, trigger) {
  lastTrigger = trigger;
  document.querySelector("#dialog-category").textContent = project.label;
  document.querySelector("#dialog-title").textContent = project.title;
  document.querySelector("#dialog-summary").textContent = project.summary;
  const content = document.querySelector("#dialog-content");
  content.replaceChildren();
  if (project.gallery && project.gallery.length) {
    const gallery = node("div", "dashboard-gallery");
    project.gallery.forEach((url, index) => {
      const figure = node("figure", "dashboard-page");
      const label = project.galleryLabels?.[index] || `Dashboard PDF · Page ${index + 1} of ${project.gallery.length}`;
      const crop = project.galleryCrops?.[index];
      let preview;
      if (crop) preview = screenshotViewport(url, crop, `${project.title}: ${label}`);
      else { preview = node("img"); preview.src = url; preview.alt = `${project.title}: ${label}`; }
      figure.append(preview, node("figcaption", "", label));
      if (index === 0) { gallery.append(figure); }
      else {
        const continuation = node("details", "dashboard-continuation");
        continuation.append(node("summary", "", project.galleryLabels ? `View ${label}` : `View additional PDF page ${index + 1}`), figure);
        gallery.append(continuation);
      }
    });
    content.append(gallery);
    dialog.classList.add("dashboard-dialog");
  } else { dialog.classList.remove("dashboard-dialog"); }
  for (const [heading, value] of [["What it does", project.approach], ["My contribution", project.contribution], ["Used for", project.purpose]]) {
    const section = node("section", "detail-section");
    section.append(node("h3", "", heading), node("p", "", value));
    content.append(section);
  }
  if (project.sampleNote) content.append(node("p", "sample-note", project.sampleNote));
  const tags = node("div", "tool-tags");
  project.tools.forEach(tool => tags.append(node("span", "", tool)));
  content.append(tags);
  const links = document.querySelector("#dialog-links");
  links.replaceChildren();
  addLink(links, project.demoLabel || "View live project ↗", project.demo);
  addLink(links, "View repository ↗", project.repository);
  if (project.pdfBase64 && !project.previewPdfUrl) {
    const bytes = Uint8Array.from(atob(project.pdfBase64), char => char.charCodeAt(0));
    project.previewPdfUrl = URL.createObjectURL(new Blob([bytes], {type: "application/pdf"}));
  }
  if (project.fileBase64 && !project.previewFileUrl) {
    const bytes = Uint8Array.from(atob(project.fileBase64), char => char.charCodeAt(0));
    project.previewFileUrl = URL.createObjectURL(new Blob([bytes], {type: project.fileMime || "application/octet-stream"}));
  }
  addLink(links, project.downloadLabel || "Download sample ↓", project.previewFileUrl || project.previewPdfUrl || project.download, project.downloadName);
  dialog.showModal();
}

function renderProjects(filter = "all") {
  grid.replaceChildren();
  const projects = portfolioProjects.filter(project => filter === "all" || project.section === filter);
  projects.forEach(project => {
    const card = node("article", "project-card");
    const cover = node("div", `project-cover ${project.category}`);
    if (project.image && (validLink(project.image) || /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(project.image))) {
      if (project.coverCrop) cover.append(screenshotViewport(project.image, project.coverCrop, `${project.title} overview`));
      else { const image = node("img"); image.src = project.image; image.alt = `${project.title} preview`; image.loading = "lazy"; cover.append(image); }
      if (project.gallery) { cover.classList.add("dashboard-cover"); cover.append(node("p", "dashboard-cover-caption", project.previewCaption || "Actual Excel dashboard · PDF export")); }
    } else {
      const top = node("div", "cover-top"); top.append(node("span", "", project.category === "ai" ? "BUSINESS PROJECT" : "WORKING WITH INFORMATION"), node("span", "", project.number));
      cover.append(top, node("h3", "cover-title", project.cover));
      const rows = node("div", "cover-rows");
      project.coverLines.forEach((line, i) => { const row = node("div", ""); row.append(node("span", "", `0${i + 1}`), node("span", "", line), node("span", "", "↗")); rows.append(row); });
      cover.append(rows, node("p", "cover-caption", "Project illustration"));
    }
    const body = node("div", "card-body");
    body.append(node("p", "project-label", project.label), node("h3", "project-title", project.title), node("p", "project-summary", project.summary));
    const bottom = node("div", "card-bottom");
    const button = node("button", "detail-button", "View project ↗"); button.type = "button"; button.setAttribute("aria-label", `View ${project.title} details`); button.addEventListener("click", () => openProject(project, button));
    bottom.append(node("span", "ownership", project.ownership));
    const actions = node("div", "card-actions");
    actions.append(button);
    if (validLink(project.demo)) {
      const live = node("a", "detail-button", "Visit website ↗");
      live.href = project.demo; live.target = "_blank"; live.rel = "noopener noreferrer";
      live.setAttribute("aria-label", `Visit ${project.title}`);
      actions.append(live);
    }
    bottom.append(actions); body.append(bottom); card.append(cover, body); grid.append(card);
  });
  document.querySelector("#results-count").textContent = `${projects.length} projects`;
}

document.querySelectorAll(".filter").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".filter").forEach(other => { other.classList.toggle("active", other === button); other.setAttribute("aria-pressed", String(other === button)); });
  renderProjects(button.dataset.filter);
}));
document.querySelector(".close-dialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
dialog.addEventListener("close", () => { if (lastTrigger) lastTrigger.focus(); });
const contact = document.querySelector("#contact-links");
let cvUrl = portfolioProfile.cv;
if (portfolioProfile.cvBase64) {
  const bytes = Uint8Array.from(atob(portfolioProfile.cvBase64), char => char.charCodeAt(0));
  cvUrl = URL.createObjectURL(new Blob([bytes], {type: "application/pdf"}));
}
const heroCv = document.querySelector("#download-cv");
if (heroCv) { if (validLink(cvUrl)) heroCv.href = cvUrl; else heroCv.hidden = true; }
addLink(contact, "Download CV ↓", cvUrl, "Kaleem-Ullah-Sabir-CV.pdf");
addLink(contact, "LinkedIn ↗", portfolioProfile.linkedin);
addLink(contact, "GitHub ↗", portfolioProfile.github);
if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(portfolioProfile.email)) { const email = node("a", "button primary", "Email me ↗"); email.href = `mailto:${portfolioProfile.email}`; contact.append(email); }
document.querySelector("#year").textContent = new Date().getFullYear();
renderProjects();

const certificateDialog = document.querySelector("#certificate-dialog");
let lastCertificateTrigger = null;
const certificateGroups = {data: "Data & Excel", engineering: "Engineering & Safety", additional: "Additional Training", professional: "Professional development"};

function openCertificate(certificate, trigger) {
  lastCertificateTrigger = trigger;
  document.querySelector("#certificate-dialog-title").textContent = certificate.title;
  document.querySelector("#certificate-dialog-meta").textContent = `${certificate.issuer} · ${certificate.date}`;
  const image = document.querySelector("#certificate-full-image");
  image.src = certificate.image;
  image.alt = `${certificate.title} certificate awarded to Kaleem Ullah Sabir`;
  const details = document.querySelector("#certificate-details");
  details.replaceChildren();
  for (const [label, value] of [["Type", certificate.kind], ["Credential ID", certificate.credential]]) {
    const row = node("div"); row.append(node("dt", "", label), node("dd", "", value)); details.append(row);
  }
  const links = document.querySelector("#certificate-dialog-links"); links.replaceChildren();
  addLink(links, "Open certificate image ↗", certificate.image);
  addLink(links, "Issuer verification page ↗", certificate.verify);
  certificateDialog.showModal();
}

function renderCertificates(filter = "all") {
  const grid = document.querySelector("#certificate-grid"); grid.replaceChildren();
  const additionalGrid = document.querySelector("#additional-certificate-grid"); additionalGrid.replaceChildren();
  const certificates = portfolioCertificates.filter(c => filter === "all" || c.group === filter);
  certificates.forEach(certificate => {
    const card = node("article", "certificate-card");
    const imageButton = node("button", "certificate-image-button");
    imageButton.type = "button";
    imageButton.setAttribute("aria-label", `View ${certificate.title} certificate`);
    const image = node("img"); image.src = certificate.thumbnail; image.alt = `${certificate.title} certificate`; image.loading = "lazy";
    imageButton.append(image); imageButton.addEventListener("click", () => openCertificate(certificate, imageButton));
    const body = node("div", "certificate-body");
    body.append(node("p", "project-label", certificateGroups[certificate.group]), node("h3", "certificate-title", certificate.title), node("p", "certificate-issuer", certificate.issuer), node("p", "certificate-date", certificate.date));
    const button = node("button", "detail-button", "View certificate ↗"); button.type = "button";
    button.setAttribute("aria-label", `View ${certificate.title} certificate details`);
    button.addEventListener("click", () => openCertificate(certificate, button));
    body.append(button); card.append(imageButton, body);
    (certificate.group === "additional" ? additionalGrid : grid).append(card);
  });
  const additionalCount = certificates.filter(c => c.group === "additional").length;
  const coreCount = certificates.length - additionalCount;
  grid.hidden = coreCount === 0;
  const additional = document.querySelector("#additional-training");
  additional.hidden = additionalCount === 0;
  if (filter === "additional") additional.open = true;
  document.querySelector("#additional-certificate-count").textContent = `${additionalCount} certificates`;
  document.querySelector("#certificate-count").textContent = coreCount ? `${coreCount} certificates${additionalCount ? " + additional training" : ""}` : "Additional training certificates";
}
document.querySelectorAll(".certificate-filter").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".certificate-filter").forEach(other => { other.classList.toggle("active", other === button); other.setAttribute("aria-pressed", String(other === button)); });
  renderCertificates(button.dataset.certificateFilter);
}));
document.querySelector(".close-certificate").addEventListener("click", () => certificateDialog.close());
certificateDialog.addEventListener("click", event => {
  if (event.target === certificateDialog) { const r = certificateDialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) certificateDialog.close(); }
});
certificateDialog.addEventListener("close", () => { if (lastCertificateTrigger) lastCertificateTrigger.focus(); });
renderCertificates();
