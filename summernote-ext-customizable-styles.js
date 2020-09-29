/**
 * Summernote plugin that adds a style menu that lets users define their own styles.
 *
 *
 */

(function(factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('jquery'));
  } else {
    factory(window.jQuery);
  }
}(function($) {

  const CustomizableStylePlugin = function(context) {

    const ui = $.summernote.ui;
    const range = $.summernote.range;
    const dom = $.summernote.dom;
    const lists = $.summernote.lists;
    const options = context.options;
    const lang = options.langInfo;
    const styleConverter = context.modules.editor.style;

    // Create the custom style dropdown
    context.memo('button.customStyle', () => {

      // Adapted from Summernote Buttons.js
      const $buttons = ui.buttonGroup([
        ui.button({
          className: 'dropdown-toggle',
          contents: ui.dropdownButtonContents(
              ui.icon(options.icons.magic), options,
          ),
          tooltip: lang.style.style,
          data: {toggle: 'dropdown'},
          container: options.container,
        }),
        ui.dropdown({
          className: 'dropdown-style dropdown-customizable-style',
          items: options.styleTags.concat([lang.customizableStyle.addStyleMenu, lang.customizableStyle.editStylesMenu]),
          title: lang.style.style,
          template: styleDropdownItemTemplate,
          click: (event) => {
            event.preventDefault();
            const $target = $(event.target);
            const menuItem = $target.closest('[data-value]');
            const value = menuItem.data('value');
            if (value === lang.customizableStyle.addStyleMenu) {
              showAddStyleDialog(getCurrentEditorStyle());
            } else if (value === lang.customizableStyle.editStylesMenu) {
              if (options.styleTags.length > 0) {
                showEditStylesDialog(options.styleTags);
              } else {
                showAddStyleDialog(getCurrentEditorStyle());
              }
            } else {
              const tag = value;
              const className = menuItem.children().prop('class');
              context.invoke('customizableStyle.applyStyle', tag, className);
            }
          },
        })]).render();


      menuDivider().insertBefore($buttons.find('[data-value="Add style..."]'));

      return $buttons;
    });

    const menuDivider = () => {
      switch ($.summernote.interface) {
        case "bs3":
          return $('<li role="separator" class="divider"></li>');
        case "bs4":
          return $('<div class="dropdown-divider"></div>');
        default:
          return $('<hr>');
      }
    };

    this.shouldInitialize = () => options.customizableStyle.enable !== false;

    this.initialize = () => {
      this.$addStyleDialog = createAddStyleDialog();
      this.$editStylesDialog = createEditStylesDialog();
    };

    this.destroy = () => {
      this.$addStyleDialog.remove();
      this.$addStyleDialog = null;
      this.$editStylesDialog.remove();
      this.$editStylesDialog = null;
    };

    const createAddStyleDialog = () => {
      const $container = options.dialogsInBody ? $('body') : options.container;
      const body = '<div class="form-group note-form-group"><input class="form-control note-form-control note-input customizable-styles-text-input" type="text" placeholder="' + lang.customizableStyle.styleNamePlaceholder + '"/></div>'
          + '<div class="form-group note-form-group"><div class="customizable-styles-note"/></div>'
          + '<div class="form-group note-form-group"><div class="customizable-styles-preview-text"><span>' + lang.customizableStyle.preview + '</span></div></div>';
      const footer = '<input type="button" class="btn btn-primary note-btn note-btn-primary customizable-styles-add-btn" value="' + lang.customizableStyle.add + '">';
      const $dialog = ui.dialog({
        className: 'add-style-dialog',
        title: lang.customizableStyle.addStyleDialogTitle,
        fade: options.dialogsFade,
        body: body,
        footer: footer,
      }).render().appendTo($container);

      setupFormatToolbarInDialog($dialog);

      return $dialog;
    };

    const createEditStylesDialog = () => {
      const $container = options.dialogsInBody ? $('body') : options.container;
      const body = '<div class="form-group note-form-group"><div class="customizable-styles-select-style-dropdown"/></div>'
          + '<div class="form-group note-form-group"><div class="customizable-styles-note"/></div>'
          + '<div class="form-group note-form-group"><div class="customizable-styles-preview-text"><span>' + lang.customizableStyle.preview + '</span></div>'
          + '<div class="form-group note-form-group"><button class="btn btn-secondary note-btn-secondary customizable-styles-delete-btn">' + lang.customizableStyle.deleteStyle + '</button></div></div>';
      const footer = '<input type="button" class="btn btn-primary note-btn note-btn-primary customizable-styles-apply-btn" value="' + lang.customizableStyle.apply + '">';
      const $dialog = ui.dialog({
        className: 'edit-style-dialog',
        title: lang.customizableStyle.editStylesDialogTitle,
        fade: options.dialogsFade,
        body: body,
        footer: footer,
      }).render().appendTo($container);

      setupFormatToolbarInDialog($dialog);

      const $styleDropdown = $dialog.find('.customizable-styles-select-style-dropdown');
      $styleDropdown.append(ui.buttonGroup([
        ui.button({
          className: 'dropdown-toggle',
          contents: ui.dropdownButtonContents('<span class="customizable-styles-select-style-current"></span>', options),
          tooltip: lang.style.style,
          data: {toggle: 'dropdown'},
          container: options.container,
        }),
        ui.dropdown({
          className: 'customizable-style-dialog-style-dropdown',
          items: [],
          title: lang.style.style,
        })]).render());

      return $dialog;
    };

    const setupFormatToolbarInDialog = ($dialog) => {
      // Hack to get the format toolbar in the dialog is to create a new summernote
      // in the dialog body and hide everything but the toolbar
      const $formatToolbarNote = $dialog.find('.customizable-styles-note');
      $formatToolbarNote.summernote({
        toolbar: options.customizableStyle.toolbar,
        customizableStyle: {
          enable: false,
        },
      });

      // Hide the editor and status bar so that just the toolbar is visible
      const formatToolbarContext = $formatToolbarNote.data('summernote');
      $dialog.find('.note-status-output').hide();
      formatToolbarContext.layoutInfo.statusbar.hide();
      formatToolbarContext.layoutInfo.editingArea.hide();

      const $previewText = $dialog.find('.customizable-styles-preview-text :first-child');
      $dialog.preview = preview($previewText, formatToolbarContext);
      formatToolbarContext.modules.editor = $dialog.preview;
    };

    const stringStyleTagToObject = (item) => {
      return {
        tag: item,
        title: (Object.prototype.hasOwnProperty.call(lang.style, item) ? lang.style[item] : item),
        value: item,
      };
    };

    const styleDropdownItemTemplate = (item) => {
      if (item === lang.customizableStyle.addStyleMenu || item === lang.customizableStyle.editStylesMenu) {
        return item;
      } else {
        if (typeof item === 'string') {
          item = stringStyleTagToObject(item);
        }

        const tag = item.tag;
        const title = item.title;
        const style = item.style ? ' style="' + item.style + '" ' : '';
        const className = item.className ? ' class="' + item.className + '"' : '';

        return '<' + tag + style + className + '>' + title + '</' + tag + '>';
      }
    };

    const addStyleToMenu = (name, className, style) => {
      // style menu is built from the styleTag list in options
      // see https://summernote.org/deep-dive/#custom-styles for a description
      // of the item format. classCss is a custom attribute only used by this plugin.
      const styleTag = {tag: 'span', title: name, className: className, value: 'span', style: style};
      options.styleTags.push(styleTag);
      rebuildMenu();
    };

    const addStyleToDom = (className, style) => {
      // Adds the css class for the style to the current document

      const selectorText = '.' + className;

      let $styleElement = $('#customizable-styles-custom-styles-element');
      if ($styleElement.length === 0)
        $styleElement = $('<style id="customizable-styles-custom-styles-element" />').appendTo('body');
      const sheet = $styleElement[0].sheet;
      let existingRuleIndex = -1;
      for (let i = 0; i < sheet.cssRules.length; ++i) {
        if (sheet.cssRules[i].selectorText === selectorText) {
          existingRuleIndex = i;
        }
      }
      if (existingRuleIndex >= 0)
        sheet.deleteRule(existingRuleIndex);

      const rule = selectorText + ' {' + style + '}';
      sheet.insertRule(rule);
    };

    const rebuildMenu = () => {
      const $dropdown = context.layoutInfo.toolbar.find('.dropdown-customizable-style').parent();
      $dropdown.replaceWith(context.memos['button.customStyle']());
    };

    const makeValidClassName = (name) => {
      if (name[0].match(/[^a-zA-Z]/g))
        name = 'Z' + name;
      return name.replace(/[^a-zA-Z0-9_-]/g, "-");
    };

    // Get set of first block level ancestor of all nodes in a list
    // e.g. if you have the following HTML <p>foo <span>bar</span></p><h1>baz</h1>
    // and nodes = ['<span>bar</span>', '<h1>baz</h1>']
    // the result will be the <p> and <h1> nodes
    const getBlockAncestorNodes = (nodes) => {
      return lists.compact(lists.unique(nodes.map((n) => dom.ancestor(n, dom.isPara))));
    };

    // Change all block level nodes in a range to use the new tag nodeName
    // Splits nodes as needed to only apply the new block to the selected
    // part of partially selected nodes.
    const applyBlockTag = (rng, nodeName) => {
      rng = rng.splitText();
      if (rng.isCollapsed()) {
        return [rng.insertNode(dom.create(nodeName))];
      }

      let nodes = rng.nodes();
      let blockParentNodes = getBlockAncestorNodes(nodes);
      if (blockParentNodes || blockParentNodes.length === 0) {
        // No top level block node anywhere in the editor text - add one in
        // so that below code will work
        context.layoutInfo.editable.contents().wrapAll('<p>');
        blockParentNodes = getBlockAncestorNodes(nodes);
      }

      let startPoint = rng.getStartPoint();
      let endPoint = rng.getEndPoint();
      const newParents = blockParentNodes.map((parent) => {
        if (parent.contains(startPoint.node) && !dom.isLeftEdgePointOf(startPoint, parent)) {
          parent = dom.splitTree(parent, startPoint);
        }
        if (parent.contains(endPoint.node) && !dom.isRightEdgePointOf(endPoint, parent)) {
          dom.splitTree(parent, endPoint);
        }
        return dom.replace(parent, nodeName);
      });

      nodes = nodes.filter((n) => !lists.contains(blockParentNodes, n)).concat(newParents);

      return nodes;
    };

    this.applyStyle = (tag, className) => {

      const editor = context.modules.editor;
      let rng = editor.getLastRange();
      const spans = dom.isPara(dom.create(tag)) ?
          applyBlockTag(rng, tag) :
          editor.style.styleNodes(rng, { nodeName: tag });
      if ($(spans).className)
        $(spans).removeClass();
      if (className)
        $(spans).addClass(className);

      // This is copied from fontStyling() in Editor.js
      // It handles the case where there is no selection
      // and you need to insert a new span with the new format
      // so that when you start typing it inserts with the new style
      if (rng.isCollapsed()) {
        const firstSpan = lists.head(spans);
        if (firstSpan && !dom.nodeLength(firstSpan)) {
          firstSpan.innerHTML = dom.ZERO_WIDTH_NBSP_CHAR;
          range.createFromNode(firstSpan.firstChild).select();
          editor.setLastRange();
          editor.$editable.data(editor.KEY_BOGUS, firstSpan);
        }
      } else {
        editor.setLastRange(
            editor.createRangeFromList(spans).select(),
        );
      }
    };

    this.addStyle = (name, style) => {
      const className = makeValidClassName(name);
      addStyleToDom(className, style);
      addStyleToMenu(name, className, style);
      context.triggerEvent('customizableStyle.styleAdded', name, style);
    };

    this.getStyles = () => {
      return options.styleTags;
    };

    this.setStyles = (styleTags) => {
      options.styleTags = styleTags;
      styleTags.forEach((t) => {
        if (t.className && t.style) {
          addStyleToDom(t.className, t.style);
        }
      });
      rebuildMenu();
      context.triggerEvent('customizableStyle.stylesUpdated', styleTags);
    };

    const summernoteStyleToCss = (style) => {
      const $element = $('<span>');
      if (style['font-bold'] === 'bold')
        $element.css('font-weight', 'bold');
      if (style['font-italic'] === 'italic')
        $element.css('font-style', 'italic');
      if (style['font-underline'] === 'underline')
        $element.css('text-decoration', 'underline');
      $element.css('font-family', style['font-family']);
      $element.css('font-size', style['font-size'] + (style['font-size-unit'] || 'px'));
      $element.css('color', style['color']);
      $element.css('background-color', style['background-color']);
      return $element.attr('style');
    };

    const cssStyleToSummernoteStyle = (css) => {
      const $element = $('<span>').attr('style', css);

      // This gets font-family, font-size and some other stuff
      const styleInfo = styleConverter.fromNode($element);

      // The others we have to do ourselves
      const props = $element.css(['font-weight', 'font-style', 'text-decoration', 'color', 'background-color']);
      styleInfo['font-bold'] = props['font-weight'] === 'bold' ? 'bold' : 'normal';
      styleInfo['font-italic'] = props['font-style'] === 'italic' ? 'italic' : 'normal';
      styleInfo['font-underline'] = props['text-decoration'] === 'underline' ? 'underline' : 'normal';
      styleInfo['color'] = props['color'];
      styleInfo['background-color'] = props['background-color'];

      return styleInfo;
    };

    const getCurrentEditorStyle = () => {
      const currentStyle = context.invoke('editor.currentStyle');
      currentStyle['color'] = document.queryCommandValue('foreColor');
      currentStyle['background-color'] = document.queryCommandValue('backColor');
      return currentStyle;
    };

    // Text preview handler - replaces the standard summernote editor
    // module so that the formatting commands from the toolbar are
    // applied to the element $previewText
    const preview = ($previewText, context) => {
      let style = {};
      let tag = 'span';

      const update = () => {
        const $newPreviewText = $('<' + tag + '>').append(lang.customizableStyle.preview);
        $previewText.replaceWith($newPreviewText);
        $previewText = $newPreviewText;
        $previewText.attr('style', summernoteStyleToCss(style));
        context.invoke('buttons.updateCurrentStyle');
      };

      return {
        shouldInitialize: () => true,
        bold: () => {
          style['font-bold'] = style['font-bold'] === 'bold' ? 'normal' : 'bold';
          update();
        },
        italic: () => {
          style['font-italic'] = style['font-italic'] === 'italic' ? 'normal' : 'italic';
          update();
        },
        underline: () => {
          style['font-underline'] = style['font-underline'] === 'underline' ? 'normal' : 'underline';
          update();
        },
        removeFormat: () => {
          style['font-bold'] = 'normal';
          style['font-italic'] = 'normal';
          style['font-underline'] = 'normal';
          update();
        },
        fontName: (value) => {
          style['font-family'] = value;
          update();
        },
        fontSize: (value) => {
          style['font-size'] = value;
          update();
        },
        fontSizeUnit: (value) => {
          style['font-size-unit'] = value;
          update();
        },
        foreColor: (value) => {
          style['color'] = value;
          update();
        },
        backColor: (value) => {
          style['background-color'] = value;
          update();
        },
        currentStyle: () => style,
        currentTag: () => tag,
        setCurrentStyle: (s, t) => {
          style = s;
          tag = t || 'span';
          update();
        },
      };
    };

    const showAddStyleDialog = (style) => {

      const $submitButton = this.$addStyleDialog.find('.customizable-styles-add-btn');
      const $styleName = this.$addStyleDialog.find('.customizable-styles-text-input');

      this.$addStyleDialog.preview.setCurrentStyle(style);

      $styleName.val('');
      ui.toggleBtn($submitButton, false);

      ui.onDialogShown(this.$addStyleDialog, () => {
        context.triggerEvent('dialog.shown');

        $styleName.on('input paste propertychange', () => {
          // enable button only if style name is not
          ui.toggleBtn($submitButton, $styleName.val());
        });

        // Trigger submit on enter
        $styleName.on('keypress', (event) => {
          if (event.keyCode === 13) {
            event.preventDefault();
            $submitButton.trigger('click');
          }
        });

        $styleName.trigger('focus');

        $submitButton.one('click', (event) => {
          event.preventDefault();
          const styleName = $styleName.val().trim();
          const style = this.$addStyleDialog.preview.currentStyle();
          context.invoke('customizableStyle.addStyle', styleName, summernoteStyleToCss(style));
          ui.hideDialog(this.$addStyleDialog);
        });
      });

      ui.onDialogHidden(this.$addStyleDialog, () => {
        $styleName.off();
        $submitButton.off();
      });

      ui.showDialog(this.$addStyleDialog);

    };

    const showEditStylesDialog = (styleTags) => {

      const $submitButton = this.$editStylesDialog.find('.customizable-styles-apply-btn');
      const $deleteButton = this.$editStylesDialog.find('.customizable-styles-delete-btn');
      let $styleDropdownCurrentSelection = this.$editStylesDialog.find('.customizable-styles-select-style-current');

      const styles = JSON.parse(JSON.stringify(styleTags));
      let currentStyleIndex = -1;

      const saveUpdateForCurrentStyle = () => {
        if (currentStyleIndex >= 0) {
          const newStyle = this.$editStylesDialog.preview.currentStyle();
          if (typeof styles[currentStyleIndex] === 'string' && $.isEmptyObject(newStyle))
            return;
          if (typeof styles[currentStyleIndex] === 'string') {
            const tag = styles[currentStyleIndex];
            styles[currentStyleIndex] = stringStyleTagToObject(styles[currentStyleIndex]);
            styles[currentStyleIndex].className = tag;
          }
          styles[currentStyleIndex].style = summernoteStyleToCss(newStyle);
        }
      };

      const setDropdownSelection = (i) => {
        saveUpdateForCurrentStyle();
        currentStyleIndex = i;
        const newStyle = styles[currentStyleIndex];
        if (typeof newStyle === 'string') {
          this.$editStylesDialog.preview.setCurrentStyle({}, newStyle);
        } else {
          this.$editStylesDialog.preview.setCurrentStyle(cssStyleToSummernoteStyle(newStyle.style) || {}, newStyle.value);
        }
        const $newSelection = $(styleDropdownItemTemplate(newStyle)).css('display', 'inline').addClass('customizable-styles-select-style-current');
        $styleDropdownCurrentSelection.replaceWith($newSelection);
        $styleDropdownCurrentSelection = $newSelection;
      };
      setDropdownSelection(0);

      const updateDropdownList = () => {
        this.$editStylesDialog
            .find('.customizable-style-dialog-style-dropdown')
            .replaceWith(ui.dropdown({
              className: 'customizable-style-dialog-style-dropdown',
              items: styles,
              title: lang.style.style,
              template: styleDropdownItemTemplate,
              click: (event) => {
                event.preventDefault();
                const $target = $(event.target);
                const selectedIndex = styles.findIndex((t) => {
                  if (typeof t === 'string')
                    t = stringStyleTagToObject(t);
                  return t.title === $target.text()
                });
                setDropdownSelection(selectedIndex);
              },
            }).render());
        this.$editStylesDialog.find('.customizable-styles-select-style-dropdown').children().css('width', '100%'); // fix dropdown menu too narrow
      };

      updateDropdownList();

      ui.onDialogShown(this.$editStylesDialog, () => {
        context.triggerEvent('dialog.shown');

        $deleteButton.on('click', () => {
          if (styles.length > 0) {
            styles.splice(currentStyleIndex, 1);
            currentStyleIndex = -1;
            updateDropdownList();
            setDropdownSelection(0);
            ui.toggleBtn($deleteButton, styles.length > 1);
          }
        });
        ui.toggleBtn($deleteButton, styles.length > 1);

        // Trigger submit on enter
        this.$editStylesDialog.on('keypress', (event) => {
          if (event.keyCode === 13) {
            event.preventDefault();
            $submitButton.trigger('click');
          }
        });

        $submitButton.one('click', (event) => {
          event.preventDefault();
          saveUpdateForCurrentStyle();
          context.invoke('customizableStyle.setStyles', styles);
          ui.hideDialog(this.$editStylesDialog);
        });
      });

      ui.onDialogHidden(this.$editStylesDialog, () => {
        $submitButton.off();
        $deleteButton.off();
        this.$editStylesDialog.off('keypress');
      });

      ui.showDialog(this.$editStylesDialog);

    };
  };

  $.extend(true, $.summernote, {
    plugins: {
      customizableStyle: CustomizableStylePlugin,
    },

    options: {
      customizableStyle: {
        enable: true,
        toolbar: [
          ['font', ['bold', 'italic', 'underline', 'clear']],
          ['font', ['fontname']],
          ['fontsize', ['fontsize', 'fontsizeunit']],
          ['color', ['forecolor', 'backcolor']],
        ],
      },
    },

    lang: {
      'en-US': {
        customizableStyle: {
          add: 'Add',
          apply: 'Apply',
          addStyleMenu: 'Add style...',
          editStylesMenu: 'Edit styles...',
          addStyleDialogTitle: 'Add Style',
          editStylesDialogTitle: 'Edit Styles',
          preview: 'Preview',
          styleNamePlaceholder: 'Style name',
          deleteStyle: 'Delete style',
        },
      },
    },

  });
}));
