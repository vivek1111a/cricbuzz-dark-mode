console.log("content.js is running");

// Function to inject dark mode CSS
function injectDarkModeCSS() {
  if (!document.getElementById('darkModeStyles')) {
    console.log("Injecting dark mode CSS...");
    const style = document.createElement('style');
    style.id = 'darkModeStyles';
    style.textContent = `/* General background and text color */
body {
  background-color: #303030 !important;
  color: #e0e0e0 !important;
}
a {
  color: #ffffff;
}
.cb-match-card {
  background-color: #424242 !important;
}

.cb-match-footer {
  background-color: #555555 !important;
}
.text-normal {
  color: #ffffff !important;
}
.cb-ovr-flo {
  color: #ffffff !important;
}
.cb-match-footer-link {
  color: #ccc !important;
}
.cb-bg-white {
  background-color: #424242 !important;
}
.cb-qck-lnk-hdr {
  color: #ffffff !important;
}
.cb-text-link {
  color: #4a7cfb !important;
}
.cb-bg-off-white {
  background-color: #616161 !important;
}
.cb-font-w-500 {
  color: #ffffff !important;
}
.cb-lst-itm {
  background-color: #424242 !important;
}
.cb-nws-hdln-ancr {
  color: #ffffff !important;
}
.big-crd-rltd-txt {
  /* color: #ffffff !important; */
}
.cb-nws-intr {
  color: #c7c7c7 !important;
}
.big-crd-hdln {
  color: #ffffff !important;
}
/* a {
  color: #ece9ff !important;
} */
.cb-plus-menu-button {
  background-color: #424242 !important;
}
.cb-teams-hdr {
  background-color: #656f68 !important;
}
.cb-nav-subhdr {
  color: #a7a7a7 !important;
}
.cb-nav-subhdr a span {
  color: #a7a7a7 !important;
}
.cb-sch-filt-opt {
  background-color: #616161 !important;
  color: white !important;
}
.sr-nav-item {
  background-color: #616161 !important;
  color: #ffffff !important;
}
.cb-srs-gray-strip {
  background-color: #616161 !important;
}
.cb-srs-pnts-th {
  color: #e0e0e0 !important;
}
.sub-navigation {
  background-color: #616161 !important;
}
.nav-drp-item {
  background-color: #616161 !important;
  color: #ffffff !important;
}
tbody {
  background-color: #424242 !important;
}
.cb-text-gray {
  color: #b5b5b5 !important;
}
.cb-stats-lft-tab {
  color: white !important;
}
.cb-stats-lft-tab-active {
  background-color: #616161 !important;
  color: white !important;
}
.cb-stats-lft-tab:hover {
  background-color: #616161 !important;
}
.cb-bg-grey {
  background-color: #5f5f5f !important;
}
.text-black2 {
  color: #ffffff !important;
}
.text-gray {
  color: #c2c2c2 !important;
}
.cb-subnav-item {
  background-color: #616161 !important;
  color: #ffffff !important;
}
.cb-sub-lg-outer {
  background-color: #616161 !important;
}
.cb-sub-navigation {
  background-color: #616161 !important;
}
.cb-sub-lg-sec-head {
  color: #ffffff !important;
}
.cb-nav-pill-1 {
  background-color: #656f68 !important;
}
.cb-nav-pill-1.active {
  background-color: #028062 !important;
}
.cb-nws-time {
  color: #444 !important;
}
.cb-nws-para {
  color: #e7e7e7 !important;
}
.cb-news-table-td {
  color: white !important;
}
.label-tags {
  background-color: #616161 !important;
}
.label-tags:hover {
  background-color: #4e4e4e !important;
}
._pup {
  color: white !important;
}
._ohf {
  color: white !important;
}
.cb-lv-grn-strip {
  background-color: #656f68 !important;
  color: white !important;
}
.cb-lv-scrs-well {
  background-color: #acacac !important;
}
.cb-lv-scrs-well-complete {
  background-color: #838383 !important;
}
.cb-sch-tms-widgt {
  background-color: #505050 !important;
  color: rgb(157, 157, 157) !important;
}
.cb-sch-tms-widgt:hover {
  background-color: #464646 !important;
}
.cb-cat-text {
  color: #ffffff !important;
}
.cb-sign-up-tnc-text {
  color: #ffffff !important;
}
.cb-mtchs-dy {
  color: white !important;
}
.cb-mtchs-dy-vnu a {
  color: white !important;
}
.cb-subnav-item:hover {
  background-color: #4e4e4e !important;
}
.cb-com-ovr-sum {
  background-color: #616161 !important;
}
.cb-scrd-hdr-rw {
  background-color: #616161 !important;
}
.cb-bg-gray {
  background-color: #a8a8a8 !important;
  color: black !important;
}
.cb-hig-nv-br {
  background-color: #616161 !important;
}
.cb-hig-fltr {
  color: #ffffff !important;
}
.cb-hig-fltr.active {
  background-color: #6f6f6f !important;
}
.cb-hig-fltr:hover {
  background-color: #6f6f6f !important;
}
.cb-hig-fltr.active:hover {
  background-color: #8e8e8e !important;
}
.cb-text-inprogress {
  color: #ff485d !important;
}
.cb-text-complete {
  color: #448fff !important;
}
.cb-text-preview {
  color: #a36501 !important;
}
.cb-text-upcoming {
  color: #a36501 !important;
}
.cb-text-apple-red {
  color: #ff485d !important;
}
.cb-mtch-frmt-bg-t20 {
  background-color: #c7c7c7 !important;
  color: white !important;
}
.cb-srs-hstry-yr {
  background-color: #616161 !important;
}
.cb-srs-hstry-yr-active {
  background-color: #494949 !important;
}
.cb-wkt-bg {
  background-color: #5c5c5c !important ;
}
.cb-srs-gray-strip {
  background-color: #616161 !important;
  color: #ffffff !important;
}
.cb-stats-table-th {
  color: #ffffff !important;
}
.form-control {
  background-color: #616161 !important;
  color: #ffffff !important;
}
.cb-nav-tab {
  color: white !important;
}
.big-crd-hdln a {
  color: white !important;
}
.text-hvr-underline {
  color: white !important;
}
.cb-nws-hdln {
  color: white !important;
}
#full_commentary_btn {
  color: white !important;
}
#full_commentary_btn:hover {
  color: black !important;
}
.cb-player-name-left,
.cb-player-name-right {
  color: white !important;
}
.text-center {
  color: white !important;
}
.matchscag {
  color: rgb(137, 137, 137) !important;
}
.cb-col.pad5.cb-col-100 {
  color: white !important;
}
.cb-srs-pnts {
  color: white !important;
}
.cb-mtch-frmt-bg-t20 {
  background-color: #878787 !important;
  color: white !important;
}
.cb-bg-player-in {
  background-color: #545e57 !important;
}
.cb-bg-player-out {
  background-color: #574e4f !important;
}
.cb-caret-down {
  color: white !important;
}
.cb-caret-up {
  color: white !important;
}
.txt-hvr-underline {
  color: white !important;
}
.text-white {
  color: white !important;
}
.poll-opt {
  color: white;
}
.cb-lv-scr-mtch-hdr {
  color: white !important;
}
.cb-lv-grn-strip a {
  color: white !important;
}
.cb-view-all-ga {
  color: white !important;
}
.cb-vid-more {
  color: #3952d0 !important;
}
.cb-srs-pnts-td a {
  color: white !important;
}
.cb-link-undrln {
  color: white !important;
}
.cb-caret-right {
  color: white !important;
}
.cb-embed-video {
  background-color: #616161 !important;
  color: white !important;
}
.cb-video-modal-title {
  background-color: #616161 !important;
  color: white !important;
}
.cb-video-close-btn {
  color: white !important;
  background-color: #616161 !important;
}
`;
    document.head.appendChild(style);
    console.log("Dark mode CSS injected.");
  }
}

// Function to remove dark mode CSS
function removeDarkModeCSS() {
  const darkStyles = document.getElementById('darkModeStyles');
  if (darkStyles) {
    console.log("Removing dark mode CSS...");
    darkStyles.remove();
    console.log("Dark mode CSS removed.");
  }
}

// Check the current dark mode status on script load
chrome.storage.sync.get('darkModeEnabled', (data) => {
  if (data.darkModeEnabled) {
    injectDarkModeCSS();
  } else {
    removeDarkModeCSS();
  }
});

// Listen for messages to toggle dark mode
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content.js:", request);
  
  if (request.darkModeEnabled) {
    injectDarkModeCSS();
  } else {
    removeDarkModeCSS();
  }
  
  sendResponse({ status: "done" });
});
