function _scrollbar(parent) {
  this.parent = parent;
  this.enabled = window.GetProperty('_DISPLAY: Show Scroll Bar', true);
  this.visible = undefined;
  this.width = get_system_scrollbar_width();
  this.cursorh_min = scale(32);
  this.timer = false;
  this.timer_count = -1;
  this.buttons = new Array(3);
  this.type = { cursor: 0, up: 1, down: 2 };
  this.images = { up: {}, down: {}, cursor: {} };
  this.click = false;
  this.colours = new Array(3);
  this.font = g_font_icon;
  
  this.colours_changed = () => {
    this.set_buttons();
    this.set_cursorbutton();
  }
  
  this.set_buttons = () => {
    this.colours.normal = blendColours(g_colour_normal_bg, g_colour_normal_txt, 0.15);
    this.colours.hover = blendColours(g_colour_normal_bg, g_colour_normal_txt, 0.20);
    this.colours.down = blendColours(g_colour_normal_bg, g_colour_normal_txt, 0.25);

    this.images.up.normal = gdi.CreateImage(this.w, this.w);
    let gb = this.images.up.normal.GetGraphics();
		gb.SetTextRenderingHint(4);
		gb.DrawString('\ueb0f', this.font, this.colours.normal, 0, 0, this.w - 1, this.w - 1, SF.CENTRE);
    this.images.up.normal.ReleaseGraphics(gb);

    this.images.up.hover = gdi.CreateImage(this.w, this.w);
    gb = this.images.up.hover.GetGraphics();
		gb.SetTextRenderingHint(4);
		gb.DrawString('\ueb0f', this.font, this.colours.hover, 0, 0, this.w - 1, this.w - 1, SF.CENTRE);
    this.images.up.hover.ReleaseGraphics(gb);

    this.images.up.down = gdi.CreateImage(this.w, this.w);
    gb = this.images.up.down.GetGraphics();
		gb.SetTextRenderingHint(4);
		gb.DrawString('\ueb0f', this.font, this.colours.down, 0, 0, this.w - 1, this.w - 1, SF.CENTRE);
    this.images.up.down.ReleaseGraphics(gb);

    this.images.down.normal = gdi.CreateImage(this.w, this.w);
    gb = this.images.down.normal.GetGraphics();
		gb.SetTextRenderingHint(4);
		gb.DrawString('\ueb11', this.font, this.colours.normal, 0, 0, this.w - 1, this.w - 1, SF.CENTRE);
    this.images.down.normal.ReleaseGraphics(gb);

    this.images.down.hover = gdi.CreateImage(this.w, this.w);
    gb = this.images.down.hover.GetGraphics();
		gb.SetTextRenderingHint(4);
		gb.DrawString('\ueb11', this.font, this.colours.hover, 0, 0, this.w - 1, this.w - 1, SF.CENTRE);
    this.images.down.hover.ReleaseGraphics(gb);

    this.images.down.down = gdi.CreateImage(this.w, this.w);
    gb = this.images.down.down.GetGraphics();
		gb.SetTextRenderingHint(4);
		gb.DrawString('\ueb11', this.font, this.colours.down, 0, 0, this.w - 1, this.w - 1, SF.CENTRE);
    this.images.down.down.ReleaseGraphics(gb);

    this.buttons[this.type.up] = new button(this.images.up.normal, this.images.up.hover, this.images.up.down);
    this.buttons[this.type.down] = new button(this.images.down.normal, this.images.down.hover, this.images.down.down);
  }

  this.set_cursorbutton = () => {
    this.colours.normal = blendColours(g_colour_normal_bg, g_colour_normal_txt, 0.15);
    this.colours.hover = blendColours(g_colour_normal_bg, g_colour_normal_txt, 0.20);
    this.colours.down = blendColours(g_colour_normal_bg, g_colour_normal_txt, 0.25);

    this.images.cursor.normal = gdi.CreateImage(this.cursorw, this.cursorh);
    let gb = this.images.cursor.normal.GetGraphics();
    gb.FillSolidRect(0, 0, this.cursorw - 1, this.cursorh - 1, this.colours.normal);
    this.images.cursor.normal.ReleaseGraphics(gb);

    this.images.cursor.hover = gdi.CreateImage(this.cursorw, this.cursorh);
    gb = this.images.cursor.hover.GetGraphics();
    gb.FillSolidRect(0, 0, this.cursorw - 1, this.cursorh - 1, this.colours.hover);
    this.images.cursor.hover.ReleaseGraphics(gb);

    this.images.cursor.down = gdi.CreateImage(this.cursorw, this.cursorh);
    gb = this.images.cursor.down.GetGraphics();
    gb.FillSolidRect(0, 0, this.cursorw - 1, this.cursorh - 1, this.colours.down);
    this.images.cursor.down.ReleaseGraphics(gb);

    this.buttons[this.type.cursor] = new button(this.images.cursor.normal, this.images.cursor.hover, this.images.cursor.down);
    this.buttons[this.type.cursor].x = this.x;
    this.buttons[this.type.cursor].y = this.cursory;
  }

  this.paint = gr => {    
    this.visible && this.buttons[this.type.cursor].paint(gr, this.x, this.cursory, 255);    
    this.buttons[this.type.up].paint(gr, this.x, this.y, 255);
    this.buttons[this.type.down].paint(gr, this.x, this.areay + this.areah, 255);
  }

  this.update = () => {
    let prev_cursorh = this.cursorh;
		this.total = typeof eval(this.parent + '.row_count') == 'number' ? eval(this.parent + '.row_count') : eval(this.parent + '.rows').length;
		this.rowh = typeof eval(this.parent + '.row_height') == 'number' ? eval(this.parent + '.row_height') : ppt.row_height;
    this.totalh = this.total * this.rowh;
    // set scrollbar visibility
    this.visible = this.totalh > eval(this.parent + '.h');
    // set cursor width/height
    this.cursorw = this.width;
    if (this.total > 0) {
      this.cursorh = Math.round((eval(this.parent + '.h') / this.totalh) * this.areah);
      if (this.cursorh < this.cursorh_min)
        this.cursorh = this.cursorh_min;
    } else {
      this.cursorh = this.cursorh_min;
    }
    // set cursor y pos
    this.set_cursor_y();
		if (this.cursorw && this.cursorh && this.cursorh != prev_cursorh)
      this.set_cursorbutton();
  }

  this.set_cursor_y = () => {
    // set cursor y pos
    let ratio = scroll / (this.totalh - eval(this.parent + '.h'));
    this.cursory = this.areay + Math.round((this.areah - this.cursorh) * ratio);
  }

  this.size = () => {
    this.buttonh = this.width;
    this.x = eval(this.parent + '.x') + eval(this.parent + '.w');
    this.y = eval(this.parent + '.y');
    this.w = this.width;
    this.h = eval(this.parent + '.h');
    this.areay = this.y + this.buttonh;
    this.areah = this.h - (this.buttonh * 2);
    this.set_buttons();
  }

  this.set_from_cursor_pos = () =>{
    // calc ratio of the scroll cursor to calc the equivalent item for the full list (with gh)
    let ratio = (this.cursory - this.areay) / (this.areah - this.cursorh);
    // calc idx of the item (of the full list with gh) to display at top of the panel list (visible)
    scroll = Math.round((this.totalh - eval(this.parent + '.h')) * ratio);
  }

  this.check = (event, x, y) => {
    if (!this.buttons[this.type.cursor])
      return;
    switch (event) {
    case 'lbtn_down':
      let tmp = this.buttons[this.type.cursor].checkstate(event, x, y);
      if (tmp == ButtonStates.down) {
        this.cursorClickX = x;
        this.cursorClickY = y;
        this.cursorDrag = true;
        this.cursorDragDelta = y - this.cursory;
      }
      break;
    case 'lbtn_up':
      this.buttons[this.type.cursor].checkstate(event, x, y);
      if (this.cursorDrag) {
        this.set_from_cursor_pos();
        eval(this.parent + '.repaint')();
      }
      this.cursorClickX = 0;
      this.cursorClickY = 0;
      this.cursorDrag = false;
      break;
    case 'move':
      this.buttons[this.type.cursor].checkstate(event, x, y);
      if (this.cursorDrag) {
        this.cursory = y - this.cursorDragDelta;
        if (this.cursory + this.cursorh > this.areay + this.areah) {
          this.cursory = (this.areay + this.areah) - this.cursorh;
        }
        if (this.cursory < this.areay) {
          this.cursory = this.areay;
        }
        this.set_from_cursor_pos();
        eval(this.parent + '.repaint')();
      }
      break;
    case 'leave':
      this.buttons[this.type.cursor].checkstate(event, 0, 0);
      break;
    }
  }

  this.hover = (x, y) => {
    return (x >= this.x && x <= this.x + this.w && y >= this.y && y <= this.y + this.h);
  }

  this.hover_area = (x, y) => {
    return (x >= this.x && x <= this.x + this.w && y >= this.areay && y <= this.areay + this.areah);
  }

  this.hover_cursor = (x, y) => {
    return (x >= this.x && x <= this.x + this.w && y >= this.cursory && y <= this.cursory + this.cursorh);
  }

  this.on_mouse = (event, x, y, delta) => {
    this.isHover = this.hover(x, y);
    this.isHoverArea = this.hover_area(x, y);
    this.isHoverCursor = this.hover_cursor(x, y);
    this.isHoverButtons = this.isHover && !this.isHoverCursor && !this.isHoverArea;
    this.isHoverEmptyArea = this.isHoverArea && !this.isHoverCursor;

    let scroll_step = this.rowh;
    let scroll_step_page = eval(this.parent + '.h');

    switch (event) {
    case 'lbtn_down':
    case 'lbtn_dblclk':
      if ((this.isHoverCursor || this.cursorDrag) && !this.click && !this.isHoverEmptyArea) {
        this.check(event, x, y);
      } else {
        // buttons events
        let bt_state = ButtonStates.normal;
        for (let i = 1; i < 3; i++) {
          switch (i) {
          case 1: // up button
            bt_state = this.buttons[i].checkstate(event, x, y);
            if ((event == 'lbtn_down' && bt_state == ButtonStates.down) || (event == 'lbtn_dblclk' && bt_state == ButtonStates.hover)) {
              this.click = true;
              scroll = scroll - scroll_step;
              scroll = check_scroll(scroll);
              if (!this.timer) {
                this.timer = window.SetInterval(() => {
                  if (this.timer_count > 6) {
                    scroll = scroll - scroll_step;
                    scroll = check_scroll(scroll);
                  } else {
                    this.timer_count++;
                  }
                }, 80);
              }
            }
            break;
          case 2: // down button
            bt_state = this.buttons[i].checkstate(event, x, y);
            if ((event == 'lbtn_down' && bt_state == ButtonStates.down) || (event == 'lbtn_dblclk' && bt_state == ButtonStates.hover)) {
              this.click = true;
              scroll = scroll + scroll_step;
              scroll = check_scroll(scroll);
              if (!this.timer) {
                this.timer = window.SetInterval(() => {
                  if (this.timer_count > 6) {
                    scroll = scroll + scroll_step;
                    scroll = check_scroll(scroll);
                  } else {
                    this.timer_count++;
                  }
                }, 80);
              }
            }
            break;
          }
        }
        if (!this.click && this.isHoverEmptyArea) {
          // check click on empty area scrollbar
          if (y < this.cursory) {
            // up
            this.click = true;
            scroll = scroll - scroll_step_page;
            scroll = check_scroll(scroll);
            if (!this.timer) {
              this.timer = window.SetInterval(() => {
                if (this.timer_count > 6 && m_y < eval(this.parent + '.scrollbar').cursory) {
                  scroll = scroll - scroll_step_page;
                  scroll = check_scroll(scroll);
                } else {
                  this.timer_count++;
                }
              }, 100);
            }
          } else {
            // down
            this.click = true;
            scroll = scroll + scroll_step_page;
            scroll = check_scroll(scroll);
            if (!this.timer) {
              this.timer = window.SetInterval(() => {
                if (this.timer_count > 6 && m_y > eval(this.parent + '.scrollbar').cursory + eval(this.parent + '.scrollbar').cursorh) {
                  scroll = scroll + scroll_step_page;
                  scroll = check_scroll(scroll);
                } else {
                  this.timer_count++;
                }
              }, 80);
            }
          }
        }
      }
      break;
    case 'lbtn_up':
    case 'rbtn_up':
      if (this.timer) {
        window.ClearInterval(this.timer);
        this.timer = false;
      }
      this.timer_count = -1;

      this.check(event, x, y);
      for (let i = 1; i < 3; i++) {
        this.buttons[i].checkstate(event, x, y);
      }
      this.click = false;
      break;
    case 'move':
      this.check(event, x, y);
      for (let i = 1; i < 3; i++) {
        this.buttons[i].checkstate(event, x, y);
      }
      break;
    case 'wheel':
      if (!this.click) {
        this.update();
      }
      break;
    }
  }
}
