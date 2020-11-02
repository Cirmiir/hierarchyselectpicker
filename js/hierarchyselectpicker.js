
+function ($) {
    'use strict';
  
    // HierarchySelectpicker CLASS DEFINITION
    // ====================
  
    var HierarchySelectpicker = function (element, options) {
  
      this.$element = null
      this.$dropdown = null
      this.$select = null
      this.$selectedItem = null
      this.$button = null
      this.submenu = []
      this.parentClass = null
      this.dataSource = null
      this.filter = null
  
      this.init('hierarchyselectpicker', element, options)
    }
  
    HierarchySelectpicker.VERSION = '0.0.1'

    HierarchySelectpicker.DEFAULTS = {inline:true, searchable:true}
  
    HierarchySelectpicker.prototype = {
    reconfigure : function (options) {
      this.options = options
      this.inline = this.options.inline
      this.fromHtml = true
      if (options.data)
        this.fromHtml = false
      this.items = this.options.data
      this.searchable = this.options.searchable
    },
    createSubMenu : function (element, level) {
      var options = element.subitems;
      var subMenu = $("<div class='menu'/>")
      subMenu.addClass(this.parentClass)

      if (!this.submenu[level]){
        this.submenu[level] = []
      }

      var withFilter = (this.filter && typeof this.filter === "function")      
      var isEmpty = true;
      for (var i = 0; i < options.length ; i++) {
          var option = this.createAdapter(options[i])
          var item = $("<div/>")          
          item.addClass("menu-item")          
          if (withFilter && this.filter(option))
            continue
          if (option.subitems){
              item.text(option.label)
              item.addClass("menu-button")
              item.data("menuId",  this.submenu[level].length)  
              item.data("menulevel",  level) 
              var childMenu = this.createSubMenu(option, level + 1);	
              if (childMenu == null)
                continue
              item.prepend("<div class='group-icon'/>")
              isEmpty = false
              this.submenu[level].push(childMenu)
              subMenu.append(item)
              subMenu.append(childMenu)
          }
          else{
              isEmpty = false
              item.addClass("menu-option")
              item.text(option.label)
              item.data("value", option.value)
              subMenu.append(item)
          }
      }
      if (isEmpty)
        return null;
      subMenu.data("menulevel", level - 1)
      return subMenu;
    },
    createAdapter : function(element){
        if (!this.fromHtml){
            if (!element.subitems){
                var option = $("<option/>")
                option.val(element.value);
                option.text(element.label);
                this.$element.append(option)
            }
            return element;
        }
        var $element = $(element)
        var isGroup = $element.is("optgroup") || $element.is("select")
        return {label : isGroup ? $element.attr("label") : $element.text(), subitems: isGroup ? $element.children() : null, value: $element.val()}
    },  
    rebuild : function(){     
      var level = 0 
      this.submenu = []      

      if (this.fromHtml)
        this.dataSource = this.createAdapter(this.$element);
      else{
        this.dataSource = {subitems : this.items}
        this.$element.empty();
      }
      this.$dropdown.children(".menu").remove()

      var menu = this.createSubMenu(this.dataSource, level + 1)

      if (!menu)
        menu = $("<div class='menu'/>")

      if (this.searchable)
      {
        menu.prepend(this.$search)        
        this.$dropdown.on("click", ".search-input", function(){return false;})
      }
  
      this.submenu[level] = []
      this.$button.data("menuId", this.submenu[level].length)
      this.$button.data("menulevel", level)
      this.submenu[level].push(menu)
      this.$dropdown.append(menu)      
      this.$select = menu
      
      menu.addClass("class", this.parentClass)
      menu.addClass("class", "menu")
      if (this.inline){
          menu.addClass("inline")
      }
    },
    init : function (type, element, options) {
      this.reconfigure(options)
      this.$element = $(element)
      this.parentClass = this.$element.attr("class")
      var dropdown = $("<div class='hierarchyselectpicker'/>")
      var button = $("<button class='dropdown-button btn btn-light'>Test</button>")
      this.$dropdown = dropdown      
      this.$button = button
      var search = $("<div class='search-container'><input type='text' class='search-input form-control'/></div>")
      this.$search = search
      this.$dropdown.append(button)

      button.addClass(this.parentClass)
      this.rebuild()
      var action = this.inline ? "click" : "mouseenter";
      dropdown.on(action, ".menu-button:not(.open)", $.proxy(this.showMenu, this))
      if (!this.inline){
        dropdown.on("mouseleave", ".menu", $.proxy(this.hideMenu, this))
        dropdown.on("mouseleave", ".menu-button.open", $.proxy(this.leave, this))
        dropdown.on("mouseenter", ".menu-button.open", $.proxy(this.enter, this))
      }
      else{
        
      dropdown.on("mouseleave", ".menu.inline", $.proxy(this.hideMenu, this))
      }

      if(this.searchable)
        dropdown.on('input', "input", $.proxy(this.search, this));

      dropdown.on("click", ".menu-option", $.proxy(this.selectEvent, this))
      button.on("click",$.proxy(this.showDropdown, this))
      this.$element.after(dropdown)
      this.$element.css("display", "none")
    }, 
    search: function(ev){
      var filterInput = this.$search.find("input")
      if (filterInput.val().length < 3)
      {
        if (this.filter){
          this.filter = null
          this.rebuild();
          this.submenu[0][0].addClass("show")
          filterInput.focus()
          var tmp = filterInput.val();
          filterInput.val("").val(tmp)
        }
        return
      }
      var val = filterInput.val()
      this.filter = function(item){
        return item.label.indexOf(val) === -1 && item.subitems == null
      }
      this.rebuild()
      this.submenu[0][0].addClass("show")
      filterInput.focus()
      var tmp = filterInput.val();
      filterInput.val("").val(tmp)
    },
    leave: function(ev){
        var caller = $(ev.target)
        if (caller.data("open")){
            caller.removeClass("open")
            caller.data("open", false)
        }
    },
    enter: function(ev){
        var caller = $(ev.target)
        caller.data("open", true)
    },  
    showDropdown : function(ev){
        var caller = $(ev.target)
        var position = caller.position()
        var submenu = this.submenu[0][caller.data("menuId")]
        if (!this.inline){
            submenu.css("top", position.top + caller.outerHeight())
            submenu.css("left", position.left)
        }
        submenu.toggleClass("show")
        return false
    },
    showMenu : function (ev) {
        var caller = $(ev.target)
        var levelMenu = this.submenu[caller.data("menulevel")]
        var submenu = levelMenu[caller.data("menuId")]
        if (!this.inline){
            var position = caller.position()
            for (var i = 0; i < levelMenu.length; i++) {
                var element = levelMenu[i]
                $(element).removeClass("show")            
            }
            submenu.css("top", position.top)
            submenu.css("left", caller.parent(".menu").outerWidth(true))
            submenu.addClass("show")
            caller.addClass("open")
        }       
        else{            
            submenu.toggleClass("show")
            caller.toggleClass("inline-open")
        }
        return false
    },
    hideMenu : function (ev) {
        var caller = $(ev.target)
        if(!caller.is(".menu"))
            caller = caller.parent(".menu")
        var level = caller.data("menulevel")
        this.hideMenuFromLevel(level)
        return false
    },
    hideMenuFromLevel : function(level){
      level = level || 0;
      for (var i = level; i < this.submenu.length; i++) {
        var subMenus = this.submenu[i]          
        for (var j = 0; j < subMenus.length; j++){
          subMenus[j].removeClass("show") 
          var opened = subMenus[j].find(".open")
          opened.removeClass("open")
          opened.data("open", false)
        }
      }
    },
    hide: function(){      
      this.hideMenuFromLevel(0)
    },
    selectEvent: function(ev){
      this.select(ev.target)
    },
    select : function (el) {
        if(this.$selectedItem)
          this.$selectedItem.removeClass('selected')
        this.$selectedItem = $(el);
        this.$selectedItem.addClass('selected')
        this.$element.val(this.val())
    },
    val : function(val){
        if (!val){
            return this.$selectedItem.data("value");
        }
        this.select(this.$dropdown.find((".menu-item")).filter(function(_, el) { return $(el).data("value") === val})[0])
    }
}
  
  
    function Plugin(option) {
      return this.each(function () {
        var $this = $(this)
        var data  = $this.data('hierarchySelectpicker')
        var options = $.extend({}, HierarchySelectpicker.DEFAULTS, $this.data(), typeof option == 'object' && option)
        $this.addClass('hierarchySelectpickercontainer')
  
        if (!data) $this.data('hierarchySelectpicker', (data = new HierarchySelectpicker(this, options)))
        if (typeof option == 'string') data[option]()
      })
    }
  
    var old = $.fn.hierarchyselectpicker
  
    $.fn.hierarchyselectpicker             = Plugin
    $.fn.hierarchyselectpicker.Constructor = HierarchySelectpicker
  
    $.fn.hierarchyselectpicker.noConflict = function () {
      $.fn.hierarchyselectpicker = old
      return this
    }

    
  $(document).on('click.bs.hierarchySelectpicker.data-api', ':not(.hierarchyselectpicker), :not(.search-input)' , function(){
    $('select.hierarchySelectpickercontainer').each(function () { $(this).data('hierarchySelectpicker').hide();});
  })
  
  }(jQuery);