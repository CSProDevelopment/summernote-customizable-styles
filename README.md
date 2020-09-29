# summernote-customizable-styles
A [Summernote](https://github.com/summernote/summernote/) plugin that adds the ability to create and modify styles.

This plugin adds a new version of the style menu that adds *Add Style...* and *Edit Style...* options. When selected, these options bring up a dialog that lets you change add a new style or modify and existing style. You can set the following attributes on a style:

- bold
- underline
- italic
- font family, size and size units
- font color and background color

When a new style is created it is added to the style menu and may be used similary to the built in styles.

Custom styles are implemented by creating new CSS classes so modifying an existing style modifies existing markup using the style. Note that this does not apply if for the unmodified built-in styles (normal, h1, h2...) since they do not use classes.
 
### Installation

#### 1. Include JS

Include the following code after including Summernote:

```html
<script src="summernote-ext-customizable-styles.js"></script>
```

#### 2. Supported languages
Currently available in English.

#### 3. Summernote options
Customize the Summernote Toolbar by adding a 'customStyle' button.
To specify which format buttons will appear in the add/edit styles dialogs specify another toolbar inside the *customizableStyle* options.

To specify the initial set of styles to show in the menu use the styleTags options as described in the [Summernote documentation](https://summernote.org/deep-dive/#custom-styles).

```javascript
$(document).ready(function() {
  $('#summernote').summernote({
    toolbar:[
      ['style', ['customStyle']],
      ['font', ['bold', 'italic', 'underline']],
      ['font', ['fontname','fontsize']],
      ['color', ['forecolor', 'backcolor']],
      ['view', ['codeview']]
      ],
      customizableStyle: {
        toolbar: [
          ['font', ['bold', 'italic', 'underline', 'clear']],
          ['font', ['fontname','fontsize']],
          ['color', ['forecolor', 'backcolor']],
        ],
      },
  });
});
```

#### 4. API

The plugin has the following API:

```javascript
// Return current contents of style menu as list of styleTag objects
$('#summernote').summernote('customizableStyle.getStyles')

// Set the contents of style menu to a list of style objects
// New CSS classes are added to the DOM dynamically.
$('#summernote').summernote('customizableStyle.setStyles', styles)

// Add a new style to the style menu
// A new CSS class is added to the DOM dynamically.
$('#summernote').summernote('customizableStyle.addStyle', name, style)
```

#### 5. Events

The plugin triggers the following events:

- customizableStyle.styleAdded: when a new style is added to the menu. Receives name and styleTag object.
- customizableStyle.stylesUpdated: when one or more styles in menu are modified or deleted. Receives the new list of styles as a list of styleTag objects.

