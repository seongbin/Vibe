// Predefined folders
var THEME_FOLDER = fb.ProfilePath + 'user-scripts\\';
var IMAGE_FOLDER = THEME_FOLDER + 'images\\';
var CACHE_FOLDER = fb.ProfilePath + 'cache\\';

// System resources
var fso = new ActiveXObject('Scripting.FileSystemObject');
var WshShell = new ActiveXObject('WScript.Shell');
var htmlfile = new ActiveXObject('htmlfile');
var dpi = WshShell.RegRead('HKCU\\Control Panel\\Desktop\\WindowMetrics\\AppliedDPI');

// *****************************************************************************************************************************************
// Common functions & flags by Br3tt aka Falstaff (c)2013-2015
// *****************************************************************************************************************************************
// General declarations
DLGC_WANTARROWS = 0x0001; /* Control wants arrow keys */
DLGC_WANTTAB = 0x0002; /* Control wants tab keys */
DLGC_WANTALLKEYS = 0x0004; /* Control wants all keys */
DLGC_WANTMESSAGE = 0x0004; /* Pass message to control */
DLGC_HASSETSEL = 0x0008; /* Understands EM_SETSEL message */
DLGC_DEFPUSHBUTTON = 0x0010; /* Default pushbutton */
DLGC_UNDEFPUSHBUTTON = 0x0020; /* Non-default pushbutton */
DLGC_RADIOBUTTON = 0x0040; /* Radio button */
DLGC_WANTCHARS = 0x0080; /* Want WM_CHAR messages */
DLGC_STATIC = 0x0100; /* Static item: don't include */
DLGC_BUTTON = 0x2000; /* Button item: can be checked */
// Used in utils.Glob()
// For more information, see: http://msdn.microsoft.com/en-us/library/ee332330%28VS.85%29.aspx
FILE_ATTRIBUTE_READONLY = 0x00000001;
FILE_ATTRIBUTE_HIDDEN = 0x00000002;
FILE_ATTRIBUTE_SYSTEM = 0x00000004;
FILE_ATTRIBUTE_DIRECTORY = 0x00000010;
FILE_ATTRIBUTE_ARCHIVE = 0x00000020;
//FILE_ATTRIBUTE_DEVICE = 0x00000040; // do not use
FILE_ATTRIBUTE_NORMAL = 0x00000080;
FILE_ATTRIBUTE_TEMPORARY = 0x00000100;
FILE_ATTRIBUTE_SPARSE_FILE = 0x00000200;
FILE_ATTRIBUTE_REPARSE_POINT = 0x00000400;
FILE_ATTRIBUTE_COMPRESSED = 0x00000800;
FILE_ATTRIBUTE_OFFLINE = 0x00001000;
FILE_ATTRIBUTE_NOT_CONTENT_INDEXED = 0x00002000;
FILE_ATTRIBUTE_ENCRYPTED = 0x00004000;
// FILE_ATTRIBUTE_VIRTUAL = 0x00010000; // do not use
// }}
// Use with MenuManager()
// {{
MF_STRING = 0x00000000;
MF_SEPARATOR = 0x00000800;
MF_GRAYED = 0x00000001;
MF_DISABLED = 0x00000002;
MF_POPUP = 0x00000010;
// }}
// Used in get_colours()
// {{
COLOR_WINDOW = 5;
COLOR_HIGHLIGHT = 13;
COLOR_BTNFACE = 15;
COLOR_BTNTEXT = 18;
// }}
// Used in window.SetCursor()
// {{
IDC_ARROW = 32512;
IDC_IBEAM = 32513;
IDC_WAIT = 32514;
IDC_CROSS = 32515;
IDC_UPARROW = 32516;
IDC_SIZE = 32640;
IDC_ICON = 32641;
IDC_SIZENWSE = 32642;
IDC_SIZENESW = 32643;
IDC_SIZEWE = 32644;
IDC_SIZENS = 32645;
IDC_SIZEALL = 32646;
IDC_NO = 32648;
IDC_APPSTARTING = 32650;
IDC_HAND = 32649;
IDC_HELP = 32651;
// }}
// Use with GdiDrawText()
// {{
DT_LEFT = 0x00000000;
DT_RIGHT = 0x00000002;
DT_TOP = 0x00000000;
DT_BOTTOM = 0x00000008;
DT_CENTER = 0x00000001;
DT_VCENTER = 0x00000004;
DT_WORDBREAK = 0x00000010;
DT_SINGLELINE = 0x00000020;
DT_CALCRECT = 0x00000400;
DT_NOPREFIX = 0x00000800;
DT_EDITCONTROL = 0x00002000;
DT_END_ELLIPSIS = 0x00008000;
// }}
// Keyboard Flags & Tools
// {{
VK_F1 = 0x70;
VK_F2 = 0x71;
VK_F3 = 0x72;
VK_F4 = 0x73;
VK_F5 = 0x74;
VK_F6 = 0x75;
VK_BACK = 0x08;
VK_TAB = 0x09;
VK_RETURN = 0x0D;
VK_SHIFT = 0x10;
VK_CONTROL = 0x11;
VK_ALT = 0x12;
VK_ESCAPE = 0x1B;
VK_PGUP = 0x21;
VK_PGDN = 0x22;
VK_END = 0x23;
VK_HOME = 0x24;
VK_LEFT = 0x25;
VK_UP = 0x26;
VK_RIGHT = 0x27;
VK_DOWN = 0x28;
VK_INSERT = 0x2D;
VK_DELETE = 0x2E;
VK_SPACEBAR = 0x20;
KMask = {
  none: 0,
  ctrl: 1,
  shift: 2,
  ctrlshift: 3,
  ctrlalt: 4,
  ctrlaltshift: 5,
  alt: 6
}
function GetKeyboardMask() {
  var c = utils.IsKeyPressed(VK_CONTROL) ? true : false;
  var a = utils.IsKeyPressed(VK_ALT) ? true : false;
  var s = utils.IsKeyPressed(VK_SHIFT) ? true : false;
  var ret = KMask.none;
  if (c && !a && !s)
    ret = KMask.ctrl;
  if (!c && !a && s)
    ret = KMask.shift;
  if (c && !a && s)
    ret = KMask.ctrlshift;
  if (c && a && !s)
    ret = KMask.ctrlalt;
  if (c && a && s)
    ret = KMask.ctrlaltshift;
  if (!c && a && !s)
    ret = KMask.alt;
  return ret;
}
// }}
// {{
// Used in gr.DrawString()
function StringFormat() {
  var h_align = 0,
    v_align = 0,
    trimming = 0,
    flags = 0;
  switch (arguments.length) {
    case 3:
      trimming = arguments[2];
      break;
    case 2:
      v_align = arguments[1];
      break;
    case 1:
      h_align = arguments[0];
      break;
    default:
      return 0;
  }
  return ((h_align << 28) | (v_align << 24) | (trimming << 20) | flags);
}
SF = {
  LT: StringFormat(0, 0),
  CT: StringFormat(1, 0),
  RT: StringFormat(2, 0),
  LC: StringFormat(0, 1),
  CC: StringFormat(1, 1),
  RC: StringFormat(2, 1),
  LB: StringFormat(0, 2),
  CB: StringFormat(1, 2),
  RB: StringFormat(2, 2),
  CENTRE: 285212672
}
//}}
// {{
// Used everywhere!
function RGB(r, g, b) {
  return (0xff000000 | (r << 16) | (g << 8) | (b));
}
function RGBA(r, g, b, a) {
  return ((a << 24) | (r << 16) | (g << 8) | (b));
}
function getAlpha(colour) {
  return ((colour >> 24) & 0xff);
}
function getRed(colour) {
  return ((colour >> 16) & 0xff);
}
function getGreen(colour) {
  return ((colour >> 8) & 0xff);
}
function getBlue(colour) {
  return (colour & 0xff);
}
function negative(colour) {
  var R = getRed(colour);
  var G = getGreen(colour);
  var B = getBlue(colour);
  return RGB(Math.abs(R - 255), Math.abs(G - 255), Math.abs(B - 255));
}
function toRGB(d) { // convert back to RGB values
  var d = d - 0xff000000;
  var r = d >> 16;
  var g = d >> 8 & 0xff;
  var b = d & 0xff;
  return [r, g, b];
}
function blendColours(c1, c2, factor) {
  // When factor is 0, result is 100% colour1, when factor is 1, result is 100% colour2.
  var c1 = toRGB(c1);
  var c2 = toRGB(c2);
  var r = Math.round(c1[0] + factor * (c2[0] - c1[0]));
  var g = Math.round(c1[1] + factor * (c2[1] - c1[1]));
  var b = Math.round(c1[2] + factor * (c2[2] - c1[2]));
  return (0xff000000 | (r << 16) | (g << 8) | (b));
}
function num(strg, nb) {
  if (!strg) return '';
  var i;
  var str = strg.toString();
  var k = nb - str.length;
  if (k > 0) {
    for (i = 0; i < k; i++) {
      str = '0' + str;
    }
  }
  return str.toString();
}
function TrackType(trkpath) {
  var taggable = undefined;
  var type = undefined;
  switch (trkpath) {
    case 'file':
      taggable = 1;
      type = 0;
      break;
    case 'cdda':
      taggable = 1;
      type = 1;
      break;
    case 'FOO_':
      taggable = 0;
      type = 2;
      break;
    case 'http':
      taggable = 0;
      type = 3;
      break;
    case 'mms:':
      taggable = 0;
      type = 3;
      break;
    case 'unpa':
      taggable = 0;
      type = 4;
      break;
    default:
      taggable = 0;
      type = 5;
  }
  return type;
}
// Button object
ButtonStates = {
  normal: 0,
  hover: 1,
  down: 2
}
function button(normal, hover, down) {
  this.img = Array(normal, hover, down);
  this.w = this.img[0].Width;
  this.h = this.img[0].Height;
  this.state = ButtonStates.normal;
  this.update = (normal, hover, down) => {
    this.img = Array(normal, hover, down);
    this.w = this.img[0].Width;
    this.h = this.img[0].Height;
  }
  this.paint = (gr, x, y, alpha) => {
    this.x = x;
    this.y = y;
    this.img[this.state] && gr.DrawImage(this.img[this.state], this.x, this.y, this.w, this.h, 0, 0, this.w, this.h, 0, alpha);
  }
  this.repaint = () => {
    window.RepaintRect(this.x, this.y, this.w, this.h);
  }
  this.checkstate = (event, x, y) => {
    this.ishover = (x > this.x && x < this.x + this.w - 1 && y > this.y && y < this.y + this.h - 1);
    this.old = this.state;
    switch (event) {
      case 'lbtn_down':
        switch (this.state) {
          case ButtonStates.normal:
          case ButtonStates.hover:
            this.state = this.ishover ? ButtonStates.down : ButtonStates.normal;
            this.isdown = true;
            break;
        }
        break;
      case 'lbtn_up':
        this.state = this.ishover ? ButtonStates.hover : ButtonStates.normal;
        this.isdown = false;
        break;
      case 'rbtn_up':
        break;
      case 'move':
        switch (this.state) {
          case ButtonStates.normal:
          case ButtonStates.hover:
            this.state = this.ishover ? ButtonStates.hover : ButtonStates.normal;
            break;
        }
        break;
      case 'leave':
        this.state = this.isdown ? ButtonStates.down : ButtonStates.normal;
        break;
    }
    if (this.state != this.old)
      this.repaint();
    return this.state;
  }
}
// Tools
function scale(size) {
  return Math.round(size * dpi / 72);
}
function zoom(value, factor) {
  return Math.ceil(value * factor / 100);
}
function get_system_scrollbar_width() {
  return utils.GetSystemMetrics(2);
}
function get_system_scrollbar_height() {
  return utils.GetSystemMetrics(3);
}
String.prototype.repeat = function(num) {
  if (num >= 0 && num <= 5) {
    var g = Math.round(num);
  } else {
    return '';
  }
  return new Array(g + 1).join(this);
}
function cloneObject(obj) {
  var clone = {}
  for (var i in obj) {
    if (typeof (obj[i]) == 'object' && obj[i] != null)
      clone[i] = cloneObject(obj[i]);
    else
      clone[i] = obj[i];
  }
  return clone;
}
function compareObject(o1, o2) {
  for (var p in o1) {
    if (o1[p] != o2[p]) {
      return false;
    }
  }
  for (var p in o2) {
    if (o1[p] != o2[p]) {
      return false;
    }
  }
  return true;
}
function Utf8Encode(string) {
  string = string.replace(/\r\n/g, '\n');
  var utftext = '';
  for (var n = 0; n < string.length; n++) {
    var c = string.charCodeAt(n);
    if (c < 128) {
      utftext += String.fromCharCode(c);
    } else if ((c > 127) && (c < 2048)) {
      utftext += String.fromCharCode((c >> 6) | 192);
      utftext += String.fromCharCode((c & 63) | 128);
    } else {
      utftext += String.fromCharCode((c >> 12) | 224);
      utftext += String.fromCharCode(((c >> 6) & 63) | 128);
      utftext += String.fromCharCode((c & 63) | 128);
    }
  }
  return utftext;
}
function crc32(str) {
  // discuss at: http://phpjs.org/functions/crc32/
  // original by: Webtoolkit.info (http://www.webtoolkit.info/)
  // improved by: T0bsn
  // depends on: utf8_encode
  // example 1: crc32('Kevin van Zonneveld');
  // returns 1: 1249991249
  str = Utf8Encode(str);
  var table =
    '00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D';
  var crc = 0;
  var x = 0;
  var y = 0;
  crc = crc ^ (-1);
  for (var i = 0, iTop = str.length; i < iTop; i++) {
    y = (crc ^ str.charCodeAt(i)) & 0xff;
    x = '0x' + table.substr(y * 9, 8);
    crc = (crc >>> 8) ^ x;
  }
  return crc ^ (-1);
}
function on_load() {
  if (!fso.FolderExists(CACHE_FOLDER))
    fso.CreateFolder(CACHE_FOLDER);
}
on_load();
function resize(source, crc) {
  var img = gdi.Image(source);
  if (!img) {
    return;
  }
  var s = Math.min(200 / img.Width, 200 / img.Height);
  var w = Math.floor(img.Width * s);
  var h = Math.floor(img.Height * s);
  img = img.Resize(w, h, 2);
  img.SaveAs(CACHE_FOLDER + crc, 'image/jpeg');
}
function get_path(temp) {
  var path = undefined;
  for (var iii in cover_img) {
    path = utils.Glob(temp + cover_img[iii], exc_mask = FILE_ATTRIBUTE_DIRECTORY, inc_mask = 0xffffffff);
    for (var j in path) {
      if (path[j].toLowerCase().indexOf('.jpg') > -1 || path[j].toLowerCase().indexOf('.png') > -1 || path[j].toLowerCase().indexOf('.gif') > -1) {
        return path[j];
      }
    }
  }
  return null;
}
function check_cache(metadb, albumIndex) {
  var crc = brw.groups[albumIndex].cachekey;
  if (fso.FileExists(CACHE_FOLDER + crc)) {
    return crc;
  }
  return null;
}
function cc(name) {
  return utils.CheckComponent(name, true);
}
function cf(name) {
  return utils.CheckFont(name);
}
function load_image_from_cache(metadb, crc) {
  if (fso.FileExists(CACHE_FOLDER + crc)) {
    var tdi = gdi.LoadImageAsync(window.ID, CACHE_FOLDER + crc);
    return tdi;
  } else {
    return -1;
  }
}
function process_cachekey(str) {
  var str_return = '';
  str = str.toLowerCase();
  var len = str.length;
  for (var i = 0; i < len; i++) {
    var charcode = str.charCodeAt(i);
    if (charcode > 96 && charcode < 123)
      str_return += str.charAt(i);
    if (charcode > 47 && charcode < 58)
      str_return += str.charAt(i);
  }
  return str_return;
}
function match(input, str) {
  input = input.toLowerCase();
  for (var j in str) {
    if (input.indexOf(str[j]) < 0)
      return false;
  }
  return true;
}
function process_string(str) {
  str_ = [];
  str = str.toLowerCase();
  while (str != (temp = str.replace(' ', ' ')))
    str = temp;
  var str = str.split(' ').sort();
  for (var i in str) {
    if (str[i] != '')
      str_[str_.length] = str[i];
  }
  return str_;
}
// General resources
function get_font() {
  var default_font = window.InstanceType ? window.GetFontDUI(0) : window.GetFontCUI(0);
  try { g_fname = default_font.Name; g_fsize = default_font.Size; g_fstyle = default_font.Style; } catch (e) { console.log('Spider Monkey Panel Error: Unable to use the default font. Using Arial font instead.'); g_fname = 'arial'; g_fsize = 12; g_fstyle = 0; }
  g_font_normal = gdi.Font(g_fname, g_fsize, g_fstyle);
  g_font_bold = gdi.Font(g_fname.toLowerCase() == 'segoe ui' ? 'Segoe UI Semibold' : g_fname, g_fsize, 1);
  g_font_italic = gdi.Font(g_fname, g_fsize, 2);
  g_font_underline = gdi.Font(g_fname, g_fsize, 4);
  g_font_head = gdi.Font(g_fname, g_fsize + 8, g_fstyle);
  g_font_icon = gdi.Font(cf('Segoe Fluent Icons') ? 'Segoe Fluent Icons' : 'Segoe MDL2 Assets', g_fsize);
  g_font_rating = gdi.Font(cf('guifx v2 transports') ? 'guifx v2 transports' : cf('wingdings 2') ? 'wingdings 2' : 'arial', g_fsize + 8);
  g_font_rating_char = cf('guifx v2 transports') ? 'b' : cf('wingdings 2') ? String.fromCharCode(234) : String.fromCharCode(0x25CF);
  g_font_incsearch = gdi.Font(g_fname.toLowerCase() == 'segoe ui' ? 'Segoe UI Semibold' : g_fname, g_fsize + 12);
  g_font_group1 = gdi.Font(g_fname, g_fsize + 4, g_fstyle);
  g_font_group2 = gdi.Font(g_fname, g_fsize, g_fstyle);
}
function get_colours() {
  if (window.InstanceType) {
    g_colour_normal_txt = window.GetColourDUI(0);
    g_colour_normal_bg = window.GetColourDUI(1);
    g_colour_highlight = window.GetColourDUI(2);
  } else {
    g_colour_normal_txt = window.GetColourCUI(0);
    g_colour_normal_bg = window.GetColourCUI(3);
    g_colour_highlight = window.GetColourCUI(4);
  }
  g_colour_gray_txt = 0xffb3b3b3;
  g_colour_rating = 0xffffa500;
  g_colour_btnface = utils.GetSysColour(15);
}
function get_images() {
  var gb;
  var icon_size = 256;
  var icon_font = gdi.Font(g_font_icon.Name, icon_size / 2);
  images.all = gdi.CreateImage(icon_size, icon_size);
  gb = images.all.GetGraphics();
  gb.FillSolidRect(0, 0, icon_size, icon_size, g_colour_normal_txt & 0x10ffffff);
  images.all.ReleaseGraphics(gb);
  txt = (ppt.tagMode == 1 ? 'No\nCover' : 'No Art');
  images.noart = gdi.CreateImage(icon_size, icon_size);
  gb = images.noart.GetGraphics();
  gb.FillSolidRect(0, 0, icon_size, icon_size, g_colour_normal_bg == 0xffffffff ? g_colour_btnface : blendColours(g_colour_btnface, g_colour_normal_bg, 0.9));
  gb.SetTextRenderingHint(3);
  gb.DrawString('\ue93c', icon_font, g_colour_normal_txt & 0x48ffffff, 0, 0, icon_size, icon_size, SF.CENTRE);
  images.noart.ReleaseGraphics(gb);
  txt = 'Streams';
  images.stream = gdi.CreateImage(icon_size, icon_size);
  gb = images.stream.GetGraphics();
  gb.FillSolidRect(0, 0, icon_size, icon_size, g_colour_normal_bg == 0xffffffff ? g_colour_btnface : blendColours(g_colour_btnface, g_colour_normal_bg, 0.9));
  gb.SetTextRenderingHint(3);
  gb.DrawString('\ue93e', icon_font, g_colour_normal_txt & 0x48ffffff, 0, 0, icon_size, icon_size, SF.CENTRE);
  images.stream.ReleaseGraphics(gb);
}
