// *****************************************************************************************************************************************
// INPUT BOX by Br3tt aka Falstaff (c)2013-2015
// *****************************************************************************************************************************************
function _inputbox(default_text, empty_text, text_colour, back_colour, border_colour, backselection_colour, func, parent) {
  this.gr = gdi.CreateImage(1, 1).GetGraphics();
  this.doc = new ActiveXObject('htmlfile');
  this.clipboard = null;
  this.cursor_timer = false;
  this.cursor_state = true;
  this.w = Math.min(scale(200), eval(parent + '.w') * 0.25);
  this.h = scale(32);
  this.text_colour = text_colour;
  this.back_colour = back_colour;
  this.border_colour = border_colour;
  this.backselection_colour = backselection_colour;
  this.default_text = default_text;
  this.text = default_text;
  this.empty_text = empty_text;
  this.stext = '';
  this.prev_text = '';
  this.func = func;
  this.launch_timer = false;
  this.autovalidation = false;
  this.parent = parent;
  this.edit = false;
  this.select = false;
  this.hover = false;
  this.cursor_pos = 0;
  this.cursor_x = 0;
  this.offset = 0;
  this.right_margin = 2;
  this.drag = false;
  this.font = g_font_normal;

  this.size = () => {
    this.h = scale(32);
    this.x = this.h;
    this.w = Math.min(scale(200), eval(parent + '.w') * 0.25);
    this.y = 0;
  }

  this.paint = gr => {
    this.px1 = 0;
    this.px2 = 0;
    this.DT = undefined;
    if (this.edit) {
      this.DT = DT_LEFT | DT_VCENTER | DT_SINGLELINE | DT_NOPREFIX | DT_CALCRECT;
    } else {
      this.DT = DT_LEFT | DT_VCENTER | DT_SINGLELINE | DT_NOPREFIX | DT_CALCRECT | DT_END_ELLIPSIS;
    }

    // draw bg
    this.back_colour && gr.FillSolidRect(this.x, this.y, this.w - 1, this.h - 1, this.back_colour);
    (this.border_colour && this.edit) && gr.DrawRect(this.x - this.h, this.y, this.w + this.h * 2 - 1, this.h - 1, 1, this.border_colour);

    // adjust offset to always see the cursor
    if (!this.drag && !this.select) {
      this.cursor_x = this.gr.CalcTextWidth(this.text.substr(this.offset, this.cursor_pos - this.offset), this.font);
      while (this.cursor_x >= this.w - this.right_margin) {
        this.offset++;
        this.cursor_x = this.gr.CalcTextWidth(this.text.substr(this.offset, this.cursor_pos - this.offset), this.font);
      }
    }
    // draw selection
    if (this.SelBegin != this.SelEnd) {
      this.select = true;
      this.calc_text();
      if (this.SelBegin < this.SelEnd) {
        if (this.SelBegin < this.offset) {
          this.px1 = this.x;
        } else {
          this.px1 = this.x + this.get_cursor_x(this.SelBegin);
        }
        this.px1 = this.get_cursor_x(this.SelBegin);
        this.px2 = this.get_cursor_x(this.SelEnd);
        this.text_selected = this.text.substring(this.SelBegin, this.SelEnd);
      } else {
        if (this.SelEnd < this.offset) {
          this.px1 = this.x;
        } else {
          this.px1 = this.x - this.get_cursor_x(this.SelBegin);
        }
        this.px1 = this.get_cursor_x(this.SelBegin);
        this.px2 = this.get_cursor_x(this.SelEnd);
        this.text_selected = this.text.substring(this.SelEnd, this.SelBegin);
      }
      if ((this.x + this.px1 + (this.px2 - this.px1)) > this.x + this.w) {
        gr.FillSolidRect(this.x + this.px1, this.y + 1, this.w - this.px1, this.h - 3, this.backselection_colour & 0x50ffffff);
      } else {
        gr.FillSolidRect(this.x + this.px1, this.y + 1, this.px2 - this.px1, this.h - 3, this.backselection_colour & 0x50ffffff);
      }
    } else {
      this.select = false;
      this.text_selected = '';
    }

    // draw text
    if (this.text.length > 0) {
      gr.GdiDrawText(this.text.substr(this.offset), this.font, this.edit ? this.text_colour : g_colour_gray_txt, this.x, this.y, this.w, this.h, this.DT);
    } else if (!this.edit) {
      gr.GdiDrawText(this.empty_text, this.font, g_colour_gray_txt, this.x, this.y, this.w, this.h, this.DT);
    }

    // draw cursor
    if (this.edit && !this.select)
      this.drawcursor(gr);
  }

  this.drawcursor = gr => {
    if (this.cursor_state) {
      if (this.cursor_pos >= this.offset) {
        this.cursor_x = this.get_cursor_x(this.cursor_pos);
        let x1 = this.x + this.cursor_x;
        let x2 = x1;
        let y1 = this.y + (this.h - this.font.Height) / 2 - 2;
        let y2 = this.y + (this.h + this.font.Height) / 2 + 2;
        let lt = 1;
        gr.DrawLine(x1, y1, x2, y2, lt, this.text_colour);
      }
    }
  }

  this.repaint = () => eval(this.parent + '.repaint()');

  this.calc_text = () => this.TWidth = this.gr.CalcTextWidth(this.text.substr(this.offset), this.font);

  this.get_cursor_x = pos => {
    let x = 0;
    if (pos >= this.offset) {
      x = this.gr.CalcTextWidth(this.text.substr(this.offset, pos - this.offset), this.font);
    } else {
      x = 0;
    }
    return x;
  }

  this.get_cursor_pos = x => {
    let tx = x - this.x;
    let pos = 0;
    for (let i = this.offset; i < this.text.length; i++) {
      pos += this.gr.CalcTextWidth(this.text.substr(i, 1), this.font);
      if (pos >= tx + 3) {
        break;
      }
    }
    return i;
  }

  this.on_focus = is_focused => {
    if (!is_focused && this.edit) {
      if (this.text.length == 0) {
        this.text = this.default_text;
      }
      this.edit = false;
      // clear timer
      if (this.cursor_timer) {
        window.ClearInterval(this.cursor_timer);
        this.cursor_timer = false;
        this.cursor_state = true;
      }
      this.repaint();
    } else if (is_focused && this.edit) {
      this.reset();
    }
  }

  this.reset = () => {
    if (this.cursor_timer) {
      window.ClearInterval(this.cursor_timer);
      this.cursor_timer = false;
      this.cursor_state = true;
    }
    this.cursor_timer = window.SetInterval(() => {
      this.cursor_state = !this.cursor_state;
      eval(this.parent + '.repaint()');
    }, 500);
  }

  this.activate = (x, y) => {
    this.dblclk = false;
    this.drag = true;
    this.edit = true;
    this.cursor_pos = this.get_cursor_pos(x);
    this.anchor = this.cursor_pos;
    this.SelBegin = this.cursor_pos;
    this.SelEnd = this.cursor_pos;
    this.reset();
  }

  this.is_active = () => {
    return this.edit;
  }

  this.check = (callback, x, y) => {
    this.hover = (x >= this.x - 2 && x <= this.x + this.w + 1) && y > this.y && y < (this.y + this.h) ? true : false;
    let tmp = undefined;
    let tmp_x = undefined;
    switch (callback) {
      case 'lbtn_down':
        if (this.hover) {
          this.activate(x, y);
        } else {
          this.edit = false;
          this.select = false;
          this.SelBegin = 0;
          this.SelEnd = 0;
          this.text_selected = '';
          if (this.cursor_timer) {
            window.ClearInterval(this.cursor_timer);
            this.cursor_timer = false;
            this.cursor_state = true;
          }
        }
        this.repaint();
        break;
      case 'lbtn_up':
        if (!this.dblclk && this.drag) {
          this.SelEnd = this.get_cursor_pos(x);
          if (this.select) {
            if (this.SelBegin > this.SelEnd) {
              this.sBeginSel = this.SelBegin;
              this.SelBegin = this.SelEnd;
              this.SelEnd = this.sBeginSel;
            }
          }
        } else {
          this.dblclk = false;
        }
        this.drag = false;
        break;
      case 'lbtn_dblclk':
        if (this.hover) {
          this.dblclk = true;
          this.SelBegin = 0;
          this.SelEnd = this.text.length;
          this.text_selected = this.text;
          this.select = true;
          this.repaint();
        }
        break;
      case 'move':
        if (this.drag) {
          this.calc_text();
          tmp = this.get_cursor_pos(x);
          tmp_x = this.get_cursor_x(tmp);
          if (tmp < this.SelBegin) {
            if (tmp < this.SelEnd) {
              if (tmp_x < this.x) {
                if (this.offset > 0) {
                  this.offset--;
                  this.repaint();
                }
              }
            } else if (tmp > this.SelEnd) {
              if (tmp_x + this.x > this.x + this.w) {
                let len = (this.TWidth > this.w) ? this.TWidth - this.w : 0;
                if (len > 0) {
                  this.offset++;
                  this.repaint();
                }
              }
            }
            this.SelEnd = tmp;
          } else if (tmp > this.SelBegin) {
            if (tmp_x + this.x > this.x + this.w) {
              let len = (this.TWidth > this.w) ? this.TWidth - this.w : 0;
              if (len > 0) {
                this.offset++;
                this.repaint();
              }
            }
            this.SelEnd = tmp;
          }
          this.cursor_pos = tmp;
          this.repaint();
        }
        // Set Mouse Cursor Style
        if (this.hover || this.drag) {
          window.SetCursor(IDC_IBEAM);
        } else if (this.ibeam_set) {
          window.SetCursor(IDC_ARROW);
        }
        this.ibeam_set = (this.hover || this.drag);
        break;
      case 'right':
        if (this.hover) {
          this.edit = true;
          this.reset();
          this.repaint();
          this.show_context_menu(x, y);
        } else {
          this.edit = false;
          this.select = false;
          this.SelBegin = 0;
          this.SelEnd = 0;
          this.text_selected = '';
          if (this.cursor_timer) {
            window.ClearInterval(this.cursor_timer);
            this.cursor_timer = false;
            this.cursor_state = true;
          }
          this.repaint();
        }
        break;
    }
  }

  this.show_context_menu = (x, y) => {
    let m = window.CreatePopupMenu();
    let ret = undefined;
    this.clipboard = this.doc.parentWindow.clipboardData.getData('Text');
    m.AppendMenuItem(this.select ? MF_STRING : MF_GRAYED | MF_DISABLED, 1, 'Copy');
    m.AppendMenuItem(this.select ? MF_STRING : MF_GRAYED | MF_DISABLED, 2, 'Cut');
    m.AppendMenuSeparator();
    m.AppendMenuItem(this.clipboard ? MF_STRING : MF_GRAYED | MF_DISABLED, 3, 'Paste');
    if (utils.IsKeyPressed(VK_SHIFT)) {
      m.AppendMenuSeparator();
      m.AppendMenuItem(MF_STRING, 4, 'Properties');
      m.AppendMenuItem(MF_STRING, 5, 'Configure...');
    }
    ret = m.TrackPopupMenu(x, y);
    switch (ret) {
      case 1:
        if (this.edit && this.select) {
          this.doc.parentWindow.clipboardData.setData('Text', this.text_selected);
        }
        break;
      case 2:
        if (this.edit && this.select) {
          this.doc.parentWindow.clipboardData.setData('Text', this.text_selected);
          let p1 = this.SelBegin;
          let p2 = this.SelEnd;
          this.offset = this.offset >= this.text_selected.length ? this.offset - this.text_selected.length : 0;
          this.select = false;
          this.text_selected = '';
          this.cursor_pos = this.SelBegin;
          this.SelEnd = this.SelBegin;
          this.text = this.text.slice(0, p1) + this.text.slice(p2);
          this.calc_text();
          this.repaint();
          this.autovalidation && this.func();
        }
        break;
      case 3:
        if (this.edit && this.clipboard) {
          if (this.select) {
            let p1 = this.SelBegin;
            let p2 = this.SelEnd;
            this.select = false;
            this.text_selected = '';
            this.cursor_pos = this.SelBegin;
            this.SelEnd = this.SelBegin;

            if (this.cursor_pos < this.text.length) {
              this.text = this.text.slice(0, p1) + this.clipboard + this.text.slice(p2);
            } else {
              this.text = this.text + this.clipboard;
            }
            this.cursor_pos += this.clipboard.length;
            this.calc_text();
            this.repaint();
          } else {
            if (this.cursor_pos > 0) {
              this.text = this.text.substring(0, this.cursor_pos) + this.clipboard + this.text.substring(this.cursor_pos, this.text.length);
            } else {
              this.text = this.clipboard + this.text.substring(this.cursor_pos, this.text.length);
            }
            this.cursor_pos += this.clipboard.length;
            this.calc_text();
            this.repaint();
          }
          this.autovalidation && this.func();
        }
        break;
      case 4:
        window.ShowProperties();
        break;
      case 5:
        window.ShowConfigure();
        break;
    }
  }

  this.on_key_down = vkey => {
    this.reset();
    let mask = GetKeyboardMask();
    if (mask == KMask.none) {
      switch (vkey) {
        case VK_BACK:
          //save text before update
          this.stext = this.text;
          if (this.edit) {
            if (this.select) {
              if (this.text_selected.length == this.text.length) {
                this.text = '';
                this.cursor_pos = 0;
              } else {
                if (this.SelBegin > 0) {
                  this.text = this.text.substring(0, this.SelBegin) + this.text.substring(this.SelEnd, this.text.length);
                  this.cursor_pos = this.SelBegin;
                } else {
                  this.text = this.text.substring(this.SelEnd, this.text.length);
                  this.cursor_pos = this.SelBegin;
                }
              }
            } else {
              if (this.cursor_pos > 0) {
                this.text = this.text.substr(0, this.cursor_pos - 1) + this.text.substr(this.cursor_pos, this.text.length - this.cursor_pos);
                if (this.offset > 0) {
                  this.offset--;
                }
                this.cursor_pos--;
                this.repaint();
              }
            }
          }
          this.calc_text();
          this.offset = this.offset >= this.text_selected.length ? this.offset - this.text_selected.length : 0;
          this.text_selected = '';
          this.SelBegin = this.cursor_pos;
          this.SelEnd = this.SelBegin;
          this.select = false;
          this.repaint();
          break;
        case VK_DELETE:
          //save text before update
          this.stext = this.text;
          if (this.edit) {
            if (this.select) {
              if (this.text_selected.length == this.text.length) {
                this.text = '';
                this.cursor_pos = 0;
              } else {
                if (this.SelBegin > 0) {
                  this.text = this.text.substring(0, this.SelBegin) + this.text.substring(this.SelEnd, this.text.length);
                  this.cursor_pos = this.SelBegin;
                } else {
                  this.text = this.text.substring(this.SelEnd, this.text.length);
                  this.cursor_pos = this.SelBegin;
                }
              }
            } else {
              if (this.cursor_pos < this.text.length) {
                this.text = this.text.substr(0, this.cursor_pos) + this.text.substr(this.cursor_pos + 1, this.text.length - this.cursor_pos - 1);
                this.repaint();
              }
            }
          }
          this.calc_text();
          this.offset = this.offset >= this.text_selected.length ? this.offset - this.text_selected.length : 0;
          this.text_selected = '';
          this.SelBegin = this.cursor_pos;
          this.SelEnd = this.SelBegin;
          this.select = false;
          this.repaint();
          break;
        case VK_RETURN:
          if (this.edit && this.text.length >= 0) {
            eval(this.func);
          }
          break;
        case VK_ESCAPE:
          if (this.edit) {
            this.edit = false;
            this.text_selected = '';
            this.select = false;
            this.repaint();
          }
          break;
        case VK_END:
          if (this.edit) {
            this.cursor_pos = this.text.length;
            this.SelBegin = 0;
            this.SelEnd = 0;
            this.select = false;
            this.repaint();
          }
          break;
        case VK_HOME:
          if (this.edit) {
            this.cursor_pos = 0;
            this.SelBegin = 0;
            this.SelEnd = 0;
            this.select = false;
            this.offset = 0;
            this.repaint();
          }
          break;
        case VK_LEFT:
          if (this.edit) {
            if (this.offset > 0) {
              if (this.cursor_pos <= this.offset) {
                this.offset--;
                this.cursor_pos--;
              } else {
                this.cursor_pos--;
              }
            } else {
              if (this.cursor_pos > 0) this.cursor_pos--;
            }
            this.SelBegin = this.cursor_pos;
            this.SelEnd = this.cursor_pos;
            this.select = false;
            this.repaint();
          }
          break;
        case VK_RIGHT:
          if (this.edit) {
            if (this.cursor_pos < this.text.length) this.cursor_pos++;
            this.SelBegin = this.cursor_pos;
            this.SelEnd = this.cursor_pos;
            this.select = false;
            this.repaint();
          }
          break;
      }
      if (this.edit) this.repaint();
    } else {
      switch (mask) {
        case KMask.shift:
          if (vkey == VK_HOME) { // SHIFT+HOME
            if (this.edit) {
              if (!this.select) {
                this.anchor = this.cursor_pos;
                this.select = true;
                if (this.cursor_pos > 0) {
                  this.SelEnd = this.cursor_pos;
                  this.SelBegin = 0;
                  this.select = true;
                  this.cursor_pos = 0;
                }
              } else {
                if (this.cursor_pos > 0) {
                  if (this.anchor < this.cursor_pos) {
                    this.SelBegin = 0;
                    this.SelEnd = this.anchor;
                  } else if (this.anchor > this.cursor_pos) {
                    this.SelBegin = 0;
                  }
                  this.cursor_pos = 0;
                }
              }
              if (this.offset > 0) {
                this.offset = 0;
              }
              this.repaint();
            }
          }
          if (vkey == VK_END) { // SHIFT+END
            if (this.edit) {
              if (!this.select) {
                this.anchor = this.cursor_pos;
                if (this.cursor_pos < this.text.length) {
                  this.SelBegin = this.cursor_pos;
                  this.SelEnd = this.text.length;
                  this.cursor_pos = this.text.length;
                  this.select = true;
                }
              } else {
                if (this.cursor_pos < this.text.length) {
                  if (this.anchor < this.cursor_pos) {
                    this.SelEnd = this.text.length;
                  } else if (this.anchor > this.cursor_pos) {
                    this.SelBegin = this.anchor;
                    this.SelEnd = this.text.length;
                  }
                  this.cursor_pos = this.text.length;
                }
              }
  
              this.cursor_x = this.gr.CalcTextWidth(this.text.substr(this.offset, this.cursor_pos - this.offset), this.font);
              while (this.cursor_x >= this.w - this.right_margin) {
                this.offset++;
                this.cursor_x = this.gr.CalcTextWidth(this.text.substr(this.offset, this.cursor_pos - this.offset), this.font);
              }
              this.repaint();
            }
          }
          if (vkey == VK_LEFT) { // SHIFT+LEFT
            if (this.edit) {
              if (!this.select) {
                this.anchor = this.cursor_pos;
                this.select = true;
                if (this.cursor_pos > 0) {
                  this.SelEnd = this.cursor_pos;
                  this.SelBegin = this.cursor_pos - 1;
                  this.select = true;
                  this.cursor_pos--;
                }
              } else {
                if (this.cursor_pos > 0) {
                  if (this.anchor < this.cursor_pos) {
                    this.SelEnd--;
                  } else if (this.anchor > this.cursor_pos) {
                    this.SelBegin--;
                  }
                  this.cursor_pos--;
                }
              }
              if (this.offset > 0) {
                tmp = this.cursor_pos;
                tmp_x = this.get_cursor_x(tmp);
                if (tmp < this.offset) {
                  this.offset--;
                }
              }
              this.repaint();
            }
          }
          if (vkey == VK_RIGHT) { // SHIFT+RIGHT
            if (this.edit) {
              if (!this.select) {
                this.anchor = this.cursor_pos;
                if (this.cursor_pos < this.text.length) {
                  this.SelBegin = this.cursor_pos;
                  this.cursor_pos++;
                  this.SelEnd = this.cursor_pos;
                  this.select = true;
                }
              } else {
                if (this.cursor_pos < this.text.length) {
                  if (this.anchor < this.cursor_pos) {
                    this.SelEnd++;
                  } else if (this.anchor > this.cursor_pos) {
                    this.SelBegin++;
                  }
                  this.cursor_pos++;
                }
              }
  
              // handle scroll text on cursor selection
              tmp_x = this.get_cursor_x(this.cursor_pos);
              if (tmp_x > (this.w - this.right_margin)) {
                this.offset++;
              }
              this.repaint();
            }
          }
          break;
        case KMask.ctrl:
          if (vkey == 65) { // CTRL+A
            if (this.edit && this.text.length > 0) {
              this.SelBegin = 0;
              this.SelEnd = this.text.length;
              this.text_selected = this.text;
              this.select = true;
              this.repaint();
            }
          }
          if (vkey == 67) { // CTRL+C
            if (this.edit && this.select) {
              this.doc.parentWindow.clipboardData.setData('Text', this.text_selected);
            }
          }
          if (vkey == 88) { // CTRL+X
            if (this.edit && this.select) {
              //save text avant MAJ
              this.stext = this.text;
              //
              this.doc.parentWindow.clipboardData.setData('Text', this.text_selected);
              let p1 = this.SelBegin;
              let p2 = this.SelEnd;
              this.select = false;
              this.text_selected = '';
              this.cursor_pos = this.SelBegin;
              this.SelEnd = this.SelBegin;
              this.text = this.text.slice(0, p1) + this.text.slice(p2);
              this.calc_text();
              this.repaint();
            }
          }
          if (vkey == 90) { // CTRL+Z (annulation saisie)
            if (this.edit) {
              this.text = this.stext;
              this.repaint();
            }
          }
          if (vkey == 86) { // CTRL+V
            this.clipboard = this.doc.parentWindow.clipboardData.getData('Text');
            if (this.edit && this.clipboard) {
              //save text avant MAJ
              this.stext = this.text;
              //
              if (this.select) {
                let p1 = this.SelBegin;
                let p2 = this.SelEnd;
                this.select = false;
                this.text_selected = '';
                this.cursor_pos = this.SelBegin;
                this.SelEnd = this.SelBegin;
                if (this.cursor_pos < this.text.length) {
                  this.text = this.text.slice(0, p1) + this.clipboard + this.text.slice(p2);
                } else {
                  this.text = this.text + this.clipboard;
                }
                this.cursor_pos += this.clipboard.length;
                this.calc_text();
                this.repaint();
              } else {
                if (this.cursor_pos > 0) { // cursor pos > 0
                  this.text = this.text.substring(0, this.cursor_pos) + this.clipboard + this.text.substring(this.cursor_pos, this.text.length);
                } else {
                  this.text = this.clipboard + this.text.substring(this.cursor_pos, this.text.length);
                }
                this.cursor_pos += this.clipboard.length;
                this.calc_text();
                this.repaint();
              }
            }
          }
          if (vkey == 90) { // CTRL+Z
            if (this.edit) {
              this.text = this.stext;
              this.repaint();
            }
          }
          break;
      }
    }
  }


    // autosearch: has text changed after on_key or on_char ?
    if (this.autovalidation) {
      if (this.text != this.prev_text) {
        // launch timer to process the search
        this.launch_timer && window.ClearTimeout(this.launch_timer);
        this.launch_timer = window.SetTimeout(() => {
          this.launch_timer = false;
          this.func();
        }, 250);
        this.prev_text = this.text;
      }
    }

  this.on_char = (code, mask) => {
    let p1 = 0;
    let p2 = 0;
    if (code == 1 && this.edit && mask == KMask.ctrl) {
      this.Spos = 0;
      this.cursor_pos = this.text.length;
      this.select = true;
      this.repaint();
    }
    if (code > 31 && this.edit) {
      //save text before update
      this.stext = this.text;
      if (this.select) {
        p1 = this.SelBegin;
        p2 = this.SelEnd;
        this.text_selected = '';
        this.cursor_pos = this.SelBegin;
        this.SelEnd = this.SelBegin;
      } else {
        p1 = this.cursor_pos;
        p2 = (this.text.length - this.cursor_pos) * -1;
      }
      if (this.cursor_pos < this.text.length) {
        this.text = this.text.slice(0, p1) + String.fromCharCode(code) + this.text.slice(p2);
      } else {
        this.text = this.text + String.fromCharCode(code);
      }
      this.cursor_pos++;
      if (this.select) {
        this.calc_text();
        if (this.TWidth <= (this.w)) {
          this.offset = 0;
        } else {
          if (this.cursor_pos - this.offset < 0) {
            this.offset = this.offset > 0 ? this.cursor_pos - 1 : 0;
          }
        }
        this.select = false;
      }
      this.repaint();
    }

    // autosearch: has text changed after on_key or on_char ?
    if (this.autovalidation) {
      if (this.text != this.prev_text) {
        // launch timer to process the search
        this.launch_timer && window.ClearTimeout(this.launch_timer);
        this.launch_timer = window.SetTimeout(() => {
          this.launch_timer = false;
          this.func();
        }, 250);
        this.prev_text = this.text;
      }
    }
  }

}
