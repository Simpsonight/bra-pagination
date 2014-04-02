/**
 * bra_pagination.js v1.3
 * A complex jQuery pagination and filter plugin.
 *
 * @author: Simon Kemmerling
 *
 * Copyright 2013, brandung GmbH & Co. KG
 * http://www.brandung.de
 */

(function ($) {

	var methods = {

		// init plugin
		init: function (options) {
			// set defaults
			var settings = $.extend({
				namespace: 'bra-',							// String: Prefix string attached to the class of every element generated by the plugin
				itemSelector: '.items',						// Selector: Items who should be used for the paging
				items: 0,
				itemsOnPage: 9,								// Integer: Number of items on every page
				pages: 0,
				currentPage: 1,								// Integer: The Page the paging should start on.

				// Navigation Controls
				controlsContainer: null,					// Object: jQuery Object whose contains the control navigation - example: $('.pagingContainer')
				maxDisplayedButtons: 3,						// Integer: Number of Buttons who should be shown - excluding minEndButtons!
				minEndButtons: 2,							// Integer: Number of Buttons at the begin and end of paging navigation who should be shown
				firstLastButton: true,						// Boolean: Show first and last navigation buttons
				prevText: '<',								// String: Set the text for the "previous" directionNav item
				nextText: '>',								// String: Set the text for the "next" directionNav item
				firstText: '<<',							// String: Set the text for the "go to first" directionNav item
				lastText: '>>',								// String: Set the text for the "go to last" directionNav item
				ellipseText: '&hellip;',					// String: Set the text for the "placeholder" item

				// Filter Options
				filter: false,								// Boolean: Set to true if items should be filtered
				filterContainer: null,						// Object: jQuery Object whose contains the filter modules - example: $('.filterContainer')
				filterWrapperSelector: '.filter-wrapper',	// Selector: Class name who be used for each filter wrapper
				filterResetButtons: '.filter-reset',		// Selector: Class name for reset button
				filterResetText: 'Filter zurücksetzen',		// String: Set text for the filter reset button
				filterData: {},
				filterAttributes: {},
				showAttributeCount: false,

				// Search Options
				search: false,								// Boolean: Set to true if items could be searched
				searchSelector: '#bra-input-search',		// Selector: Search Field selector

				// Callback API
				onInit: function () {},						// Callback triggered immediately after initialization
				onFilter: function () {},					// Callback triggered after filter toggled
				onFilterReset: function () {},				// Callback triggered after filter reset
				onUpdate: function () {}					// Callback triggered after update
			}, options || {});

			var self = this;
			// add class name for items container and wrap container
			this.addClass(settings.namespace + 'paging-items')
				.wrap('<div class="' + settings.namespace + 'paging-wrapper"></div>');
			// set wrapper class
			settings.wrapperClass = '.' + settings.namespace + 'paging-wrapper';
			// set paging items wrapper class
			settings.pagingItemsWrapper = '.' + settings.namespace + 'paging-items';
			// set paging container
			settings.controlsContainer = settings.controlsContainer != null ? settings.controlsContainer : self.parents(settings.wrapperClass);
			// set filter container
			settings.filterContainer = settings.filterContainer != null ? settings.filterContainer : self.parents(settings.wrapperClass);
			// set paging items object
			settings.$pagingItems = self.find(settings.itemSelector);
			// set active class
			settings.$pagingItems.addClass('is-active');
			// get items
			settings.items = methods._getItems.call(this, settings);
			// get pages
			settings.pages = methods._getPages(settings);
			// set currentPage count
			settings.currentPage = settings.currentPage - 1;
			// get number of buttons on each side of active page button
			settings.halfDisplayed = settings.maxDisplayedButtons / 2;

			this.each(function () {
				// bind settings to object
				self.data('pagination', settings);
				// add page class to items
				methods._setItemPageClass.call(self);
				// draw page navigation
				methods._drawPageNavigation.call(self);
				// get filter attributes
				if (settings.filter) {
					methods._appendFilter.call(self);
				}
				// init search
				methods._initSearch.call(self);
			});

			// trigger callback after initialization
			settings.onInit();

			return this;
		},

		///////////////////////////////////////////////////

		/**
		 * Remove pagination
		 * @returns {methods}
		 */
		destroy: function () {
			var $self = this,
				settings = $self.data('pagination');
			settings.controlsContainer.find($('.' + settings.namespace + 'paging-nav')).remove();
			return $self;
		},

		/**
		 * get pages
		 * @returns {number|r.pages|*|pages}
		 */
		getPagesCount: function () {
			return this.data('pagination').pages;
		},

		/**
		 * get current page
		 * @returns {*}
		 */
		getCurrentPage: function () {
			return this.data('pagination').currentPage + 1;
		},

		/**
		 * Selects the previous page
		 * @returns {methods}
		 */
		prevPage: function () {
			var $self = this,
				settings = $self.data('pagination');
			if (settings.currentPage > 0) {
				methods._selectPage.call($self, settings.currentPage - 1);
			}
			return $self;
		},

		/**
		 * Selects the next page
		 * @returns {methods}
		 */
		nextPage: function () {
			var $self = this,
				settings = $self.data('pagination');
			if (settings.currentPage < settings.pages - 1) {
				methods._selectPage.call($self, settings.currentPage + 1);
			}
			return $self;
		},

		/**
		 * Update items count on page
		 * @param itemsOnPage - how many items to show
		 * @returns {methods}
		 */
		updateItemsOnPage: function (itemsOnPage) {
			var $self = this,
				settings = $self.data('pagination');

			settings.itemsOnPage = itemsOnPage;
			settings.pages = methods._getPages(settings);
			$self.data('pagination', settings);
			// add page class to items
			methods._setItemPageClass.call($self);
			methods._selectPage.call($self, 0);
			return $self;
		},

		/**
		 * Sort items
		 * @param array - [element data attribute OR text OR class-selector], [order]
		 * @returns {methods}
		 */
		sortItems: function (sortArr) {
			var $self = this;
			// get sortable items
			methods._getSortableItems.call($self, sortArr);
			// update
			methods.update.call($self);
			return $self;
		},

		/**
		 * Filter items
		 * @param data - data-attribute
		 * @param value - data value
		 * @returns {methods}
		 */
		filterToggle: function (data, value) {
			var $self = this,
				settings = $self.data('pagination');

			// remove active class
			settings.$pagingItems.removeClass('is-active');
			// empty search field value
			$(settings.searchSelector).val('');
			// edit filter object
			methods._setFilter.call($self, settings, data, value);
			// set active class to filter items
			methods._setActiveItems.call($self);
			// set available filter
			methods._setAvailableFilterClass.call($self);
			// if object is empty, reset filter
			if (!$.isEmptyObject(settings.filterData)) {
				// get items
				settings.items = methods._getItems.call($self, settings);
				settings.pages = methods._getPages(settings);
				$self.data('pagination', settings);
				// add page class to items
				methods._setItemPageClass.call($self);
				methods._selectPage.call($self, 0);
				// show reset button
				$(settings.filterResetButtons).show();
			} else {
				methods.filterReset.call($self);
			}

			// trigger callback after filter toggle
			settings.onFilter();

			return $self;
		},

		/**
		 * Remove Filter item
		 * @param data - data-attribute
		 * @param value - data value
		 * @returns {methods}
		 */
		removeFilterItem: function (data, value) {
			var $self = this,
				settings = $self.data('pagination');

			// remove active class
			settings.$pagingItems.removeClass('is-active');
			// empty search field value
			$(settings.searchSelector).val('');
			// edit filter object
			methods._removeFilter.call($self, settings, data, value);
			// set active class to filter items
			methods._setActiveItems.call($self);
			// if object is empty, reset filter
			if (!$.isEmptyObject(settings.filterData)) {
				// get items
				settings.items = methods._getItems.call($self, settings);
				settings.pages = methods._getPages(settings);
				$self.data('pagination', settings);
				// add page class to items
				methods._setItemPageClass.call($self);
				methods._selectPage.call($self, 0);
				// show reset button
				$(settings.filterResetButtons).show();
			} else {
				methods.filterReset.call($self);
			}
			return $self;
		},

		/**
		 * Reset Filter
		 * @returns {methods}
		 */
		filterReset: function () {
			var $self = this,
				settings = $self.data('pagination');
			// reset filter object
			settings.filterData = {};
			// add active class to all items
			settings.$pagingItems.addClass('is-active');
			// remove active class from filter
			$(settings.filterWrapperSelector).find('li').removeClass('is-active');
			// hide filterResetButtons
			$(settings.filterResetButtons).hide();
			// set available filter
			methods._setAvailableFilterClass.call($self);
			// get items
			settings.items = methods._getItems.call($self, settings);
			settings.pages = methods._getPages(settings);
			$self.data('pagination', settings);
			// add page class to items
			methods._setItemPageClass.call($self);
			methods._selectPage.call($self, 0);

			// trigger callback after filter reset
			settings.onFilterReset();

			return $self;
		},

		/**
		 * Update
		 * @returns {methods}
		 */
		update: function () {
			var $self = this,
				settings = $self.data('pagination');
			// get items
			settings.items = methods._getItems.call($self, settings);
			settings.pages = methods._getPages(settings);
			$self.data('pagination', settings);
			// add page class to items
			methods._setItemPageClass.call($self);
			methods._selectPage.call($self, 0);

			// trigger callback after update
			settings.onUpdate();

			return $self;
		},

		///////////////////////////////////////////////////

		/**
		 * get sortable items
		 * @param {Array} sortArr
		 * @private
		 */
		_getSortableItems: function (sortArr) {
			var $self = this,
				settings = $self.data('pagination'),
				items = sortArr[0],
				order = sortArr[1],
				itemArr = [];

			// push items into array
			$self.find(settings.itemSelector).each(function () {
				itemArr.push($(this));
			});

			// sort array
			itemArr.sort(function (a, b) {
				var textA,
					textB,
					string = '',
					className = null;

				// if value "text" is set, sort element by text
				// if value start with a '.', sort by class selector
				if (items.indexOf('.') > -1) {
					string = 'class';
				} else {
					string = items;
				}

				switch (string) {
					case "text":
						textA = a.text().toLowerCase();
						textB = b.text().toLowerCase();
						break;
					case "class":
						textA = a.find(items).text().toLowerCase();
						textB = b.find(items).text().toLowerCase();
						break;
					default:
						textA = a.data(items);
						textB = b.data(items);
						break;
				}

				return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
			});

			// reverse array if ascending is set
			if (order === 'asc') itemArr.reverse();

			// remove items
			$self.empty();

			// paste items in new order
			$.each(itemArr, function (key, value) {
				$self.append(value);
			});

			// set paging items object
			settings.$pagingItems = $self.find(settings.itemSelector);
			$self.data('pagination', settings);
			// return new ordered object
			return $self;
		},

		/**
		 * @private  _setItemPageClass
		 */
		_setItemPageClass: function () {
			var settings = this.data('pagination'),
				pageCounter = 1,
				activeItemCounter = 0,
				tmpClass;

			// get selector class
			// if no class was set, use default class name "items"
			if (settings.itemSelector.indexOf('.') > -1) {
				var selectorArray = settings.itemSelector.split('.');
				tmpClass = selectorArray[1];
			} else {
				tmpClass = 'items';
			}

			// add page number class
			settings.$pagingItems.each(function () {
				var noPagesClass = methods._getClass($(this), tmpClass);
				// remove all class and add noPagesClass
				$(this).removeClass()
					.addClass(noPagesClass);

				if ($(this).hasClass('is-active')) {
					var pageNumber = activeItemCounter < (pageCounter * settings.itemsOnPage) - 1 ? pageCounter : pageCounter++;
					$(this).addClass('page-' + pageNumber);
					activeItemCounter++;
				}
			});

			// show/hide items on page
			methods._showHideItems.call(this);
			// re-init search
			methods._initSearch.call(this);
		},

		// get elements with active class and save them
		_getClass: function (obj, tmpClass) {
			var classString;
			// remove all page number classes
			if (obj.hasClass('is-active')) {
				classString = tmpClass + ' is-active';
			} else {
				classString = tmpClass;
			}
			return classString;
		},

		/**
		 * @private _initSearch
		 */
		_initSearch: function () {
			var $self = $(this),
				settings = this.data('pagination');

			// if search is deactivated, stop init
			if (!settings.search) return;

			// unbind keyup event
			$(settings.searchSelector).off('keyup');
			// bind keyup event
			$(settings.searchSelector).on('keyup', function () {
				// reset filter
				methods.filterReset.call($self);

				if ($(this).val().length > 2) {
					var filter = new RegExp($(this).val(), "gi");
					// search in every item
					settings.$pagingItems.each(function () {
						// remove active class
						$(this).removeClass('is-active');
						// match for value string
						var matchString = $(this).text().match(filter);
						// if match, set active class
						if (matchString != null) {
							$(this).addClass('is-active');
						}
					});
				}

				// update view
				methods.update.call($self);
			});
		},

		/**
		 * @private _drawPageNavigation
		 */
		_drawPageNavigation: function () {
			var settings = this.data('pagination'),
				interval = methods._getInterval(settings),
				$pagination;

			// destroy existing pageing navigation
			methods.destroy.call(this);
			// append paging wrapper
			$pagination = $('<ol class="' + settings.namespace + 'paging-nav"></ol>').appendTo(settings.controlsContainer);
			// generate first link
			if (settings.firstLastButton) {
				methods._appendPaginationItem.call(this, 0, {text: settings.firstText, classes: 'first'});
			}

			// generate Prev link
			if (settings.prevText) {
				methods._appendPaginationItem.call(this, settings.currentPage - 1, {text: settings.prevText, classes: 'prev'});
			}

			// generate start edges
			if (interval.start > 0 && settings.minEndButtons > 0) {
				var end = Math.min(settings.minEndButtons, interval.start);
				for (i = 0; i < end; i++) {
					methods._appendPaginationItem.call(this, i);
				}
				if (settings.minEndButtons < interval.start && (interval.start - settings.minEndButtons != 1)) {
					$pagination.append('<li class="disabled"><span class="ellipse">' + settings.ellipseText + '</span></li>');
				} else if (interval.start - settings.minEndButtons == 1) {
					methods._appendPaginationItem.call(this, settings.minEndButtons);
				}
			}

			// generate interval links
			for (var i = interval.start; i < interval.end; i++) {
				methods._appendPaginationItem.call(this, i);
			}

			// generate end edges
			if (interval.end < settings.pages && settings.minEndButtons > 0) {
				if (settings.pages - settings.minEndButtons > interval.end && (settings.pages - settings.minEndButtons - interval.end != 1)) {
					$pagination.append('<li class="disabled"><span class="ellipse">' + settings.ellipseText + '</span></li>');
				} else if (settings.pages - settings.minEndButtons - interval.end == 1) {
					methods._appendPaginationItem.call(this, interval.end++);
				}
				var begin = Math.max(settings.pages - settings.minEndButtons, interval.end);
				for (i = begin; i < settings.pages; i++) {
					methods._appendPaginationItem.call(this, i);
				}
			}

			// generate Next link
			if (settings.nextText) {
				methods._appendPaginationItem.call(this, settings.currentPage + 1, {text: settings.nextText, classes: 'next'});
			}

			// generate last link
			if (settings.firstLastButton) {
				methods._appendPaginationItem.call(this, settings.pages, {text: settings.lastText, classes: 'last'});
			}

			// debug notes
			//methods._debug.call(this, settings);
		},

		/**
		 * @private  _getInterval
		 * @param {Object} settings
		 */
		_getInterval: function (settings) {
			return {
				start: Math.ceil(settings.currentPage > settings.halfDisplayed ? Math.max(Math.min(settings.currentPage - settings.halfDisplayed, (settings.pages - settings.maxDisplayedButtons)), 0) : 0),
				end: Math.ceil(settings.currentPage > settings.halfDisplayed ? Math.min(settings.currentPage + settings.halfDisplayed, settings.pages) : Math.min(settings.maxDisplayedButtons, settings.pages))
			};
		},

		/**
		 * @private _getItems
		 * @param {Object} settings
		 */
		_getItems: function (settings) {
			var self = this,
			// get only active items
				items = self.find(settings.itemSelector).length > 0 ? self.find(settings.itemSelector + '.is-active').length : settings.items;

			return items;
		},

		/**
		 * @private _getPages
		 * @param {Object} settings
		 */
		_getPages: function (settings) {
			var pages = Math.ceil(settings.items / settings.itemsOnPage);
			return pages || 1;
		},

		/**
		 * @private _showHideItems
		 */
		_showHideItems: function () {
			var self = this,
				settings = self.data('pagination');

			self.children().hide();
			self.children('.page-' + parseInt(settings.currentPage + 1)).show();
		},

		/**
		 * @private _appendPaginationItem
		 * @param {Number} pageIndex
		 * @param {Object} opts
		 */
		_appendPaginationItem: function (pageIndex, opts) {
			var self = this,
				settings = self.data('pagination'),
				$pageWrapper = $('<li></li>'),
				$ol = settings.controlsContainer.find('ol'),
				$link = null,
				options;

			pageIndex = pageIndex < 0 ? 0 : (pageIndex < settings.pages ? pageIndex : settings.pages - 1);

			options = $.extend({
				text: pageIndex + 1,
				classes: ''
			}, opts || {});

			// get current page index and build link
			if (pageIndex == settings.currentPage || settings.disabled) {
				if (settings.disabled) {
					$pageWrapper.addClass('is-disabled');
				} else {
					$pageWrapper.addClass('is-active');
				}
				$link = $('<span class="is-current">' + (options.text) + '</span>');
			} else {
				$link = $('<a href="' + (pageIndex + 1) + '" class="' + settings.namespace + 'page-link">' + (options.text) + '</a>');
				// bind click event
				$link.click(function (event) {
					event.preventDefault();
					return methods._selectPage.call(self, pageIndex, event);
				});
			}

			if (options.classes) {
				$link.addClass(options.classes);
			}

			$pageWrapper.append($link);
			// append item to list object
			$ol.append($pageWrapper);
		},

		/**
		 * @private  _selectPage
		 * @param {Number} pageIndex
		 * @param {Event} event
		 */
		_selectPage: function (pageIndex, event) {
			var settings = this.data('pagination');
			settings.currentPage = pageIndex;
			methods._showHideItems.call(this);
			methods._drawPageNavigation.call(this);
		},

		/**
		 * @private _appendFilter
		 */
		_appendFilter: function () {
			var $self = this,
				settings = $self.data('pagination'),
				wrapperClass = null,
				selectorArray = settings.filterWrapperSelector.split('.');
			wrapperClass = selectorArray[1];

			// get filter attributes
			if (settings.showAttributeCount) {
				settings.filterAttributes = methods._getFilterAttributesWithCounts.call($self, settings);
			} else {
				settings.filterAttributes = methods._getFilterAttributes.call($self, settings);
			}

			// build filter modules
			$.each(settings.filterAttributes, function (key, value) {
				$.each(value, function (filter, value) {
					var filterStyle = key.toLowerCase(),
						filterType = filter.toLowerCase(),
						$wrapper = $('<div class="' + wrapperClass + ' filter-style-' + filterStyle + ' filter-' + filterType + '"></div>'),
						// set headline
						$filterHeadline = $('<h3>' + filter + '</h3>'),
						// build ul object
						$filterUL = $('<ul></ul>');

					// append headline to filter wrapper
					$wrapper.append($filterHeadline);
					// add children
					$.each(value, function (filter, attr) {
						if (settings.showAttributeCount) {
							$filterUL.append('<li data-attribute="' + attr[0] + '"><span> ' + attr[0] + ' (' + attr[1] + ')</span></li>');
						} else {
							$filterUL.append('<li data-attribute="' + attr + '"><span> ' + attr + '</span></li>');
						}
					});
					// append ul to filter wrapper
					$wrapper.append($filterUL);

					// bind click functions
					$filterUL.find('li').each(function () {
						var $this = $(this),
							dataFilter = 'filter-' + filterStyle + '-' + filterType,
							dataValue = $this.data('attribute');

						// add data object for rebind functionality
						$this.data(dataFilter, dataValue);
						// bind on click event
						$this.on('click', function () {
							methods._bindFilterEvent.call($this, $self, dataFilter, dataValue);
						});
					});

					// append filter to filter container
					settings.filterContainer.append($wrapper);
				});
			});
			// append reset button
			settings.filterContainer.append(methods._setResetLink.call($self));
		},

		/**
		 * @private _bindFilterEvent
		 * @param settings
		 * @param dataFilter
		 * @param dataValue
		 */
		_bindFilterEvent: function (settings, dataFilter, dataValue) {
			var $self = $(this);
			$self.toggleClass('is-active');
			// call filter toggle function
			methods.filterToggle.call(settings, dataFilter, dataValue);
		},

		/**
		 * @private _setResetLink
		 */
		_setResetLink: function () {
			var $self = this,
				settings = $self.data('pagination'),
				selectorArray = settings.filterResetButtons.split('.'),
				resetClass = selectorArray[1],
				$reset = $('<div class="' + resetClass + '"><span>' + settings.filterResetText + '</span></div>');

			$reset.hide();
			// bind click event
			$reset.on('click', function () {
				methods.filterReset.call($self);
			});
			return $reset;
		},

		/**
		 * @private _getFilterAttributes
		 * @param {object} settings
		 * @param {object} activeItems filter selector
		 */
		_getFilterAttributes: function (settings, activeItems) {
			// if activeItems set, use this selector
			// and build new array
			var item = (!activeItems) ? settings.$pagingItems : activeItems;
			var filterArray = (!activeItems) ? settings.filterAttributes : {};

			item.each(function () {
				var dataAttr = $(this).data();
				$.each(dataAttr, function (key, value) {
					// get only data attributes with name 'filter' in it
					if (!key.toLowerCase().indexOf('filter')) {
						// split key string
						var dataArray = key.match(/[A-Z]?[a-z]+|[0-9]+/g),
							dataIndex = null,
							subFilterObj = {};

						// check if data node exist
						// else add node to object
						if (filterArray[dataArray[1]]) {
							// check if data sub-node exist
							// else add sub-node to object
							if (filterArray[dataArray[1]][dataArray[2]]) {
								// get data index in array
								dataIndex = $.inArray(value, filterArray[dataArray[1]][dataArray[2]]);
								// if data isn't in array, push it
								if (dataIndex == -1) {
									filterArray[dataArray[1]][dataArray[2]].push(value);
								}
							} else {
								filterArray[dataArray[1]][dataArray[2]] = [value];
							}
						} else {
							subFilterObj[dataArray[2]] = [value];
							filterArray[dataArray[1]] = subFilterObj;
						}
					}
				});
			});

			return filterArray;
		},

		/**
		 * @private _getFilterAttributesWithCounts
		 * @param {object} settings
		 * @param {object} activeItems filter selector
		 */
		_getFilterAttributesWithCounts: function (settings, activeItems) {
			// if activeItems set, use this selector
			// and build new array
			var item = (!activeItems) ? settings.$pagingItems : activeItems;
			var filterArray = (!activeItems) ? settings.filterAttributes : {};

			item.each(function () {
				var dataAttr = $(this).data();
				$.each(dataAttr, function (key, value) {
					// get only data attributes with name 'filter' in it
					if (!key.toLowerCase().indexOf('filter')) {
						// split key string
						var dataArray = key.match(/[A-Z]?[a-z]+|[0-9]+/g),
							subFilterObj = {};

						// check if data node exist
						// else add node to object
						if (filterArray[dataArray[1]]) {
							// check if data sub-node exist
							// else add sub-node to object
							if (filterArray[dataArray[1]][dataArray[2]]) {
								// increase attribute counter
								var attributeExists = false;
								$.each(filterArray[dataArray[1]][dataArray[2]], function (key, data) {
									if (data[0] == value) {
										attributeExists = true;
										if (data[1] > 0) {
											data[1]++;
										} else {
											data[1] = 1;
										}
									}
								});

								// if attribute isn't in array, push it
								if (!attributeExists) {
									filterArray[dataArray[1]][dataArray[2]].push([value, 1]);
								}
							} else {
								filterArray[dataArray[1]][dataArray[2]] = [
									[value, 1]
								];
							}
						} else {
							subFilterObj[dataArray[2]] = [
								[value, 1]
							];
							filterArray[dataArray[1]] = subFilterObj;
						}
					}
				});
			});

			return filterArray;
		},

		/**
		 * @private _setFilter
		 * @param {Object} settings
		 * @param {String} data
		 * @param {String} value
		 */
		_setFilter: function (settings, data, value) {
			var dataIndex;
			// check if data node exist
			// else add node to object
			if (settings.filterData[data]) {
				// get data index in array
				dataIndex = $.inArray(value, settings.filterData[data]);
				// if data isn't in array, push it
				// else remove data from array
				if (dataIndex == -1) {
					settings.filterData[data].push(value);
				} else {
					settings.filterData[data].splice(dataIndex, 1);
				}
			} else {
				settings.filterData[data] = [value];
			}
		},

		/**
		 * @private _removeFilter
		 * @param {Object} settings
		 * @param {String} data
		 * @param {String} value
		 */
		_removeFilter: function (settings, data, value) {
			var dataIndex;
			// check if data node exist
			if (settings.filterData[data]) {
				// get data index in array
				dataIndex = $.inArray(value, settings.filterData[data]);
				// remove data from array
				if (dataIndex > -1) {
					settings.filterData[data].splice(dataIndex, 1);
				}
			}
		},

		/**
		 * @private _setActiveItems
		 *
		 * search: OR
		 */

		//		_setActiveItems: function() {
		//			var settings = this.data('pagination'),
		//				self = this;
		//
		//			// search data values in each item
		//			// and if key isn't empty, set active class
		//			// else delete key from object
		//			$.each(settings.filterData, function(key, data) {
		//				if(data.length != 0) {
		//					$.each(data, function(index, value) {
		//						settings.$pagingItems.each(function(){
		//							if($(this).data(key) == value) {
		//								$(this).addClass('is-active')
		//							}
		//						});
		//					});
		//				} else {
		//					delete settings.filterData[key];
		//				}
		//			});
		//		},

		/**
		 * @private _setActiveItems
		 *
		 * search: AND
		 */
		_setActiveItems: function () {
			var settings = this.data('pagination');

			// search data values in each item
			// for each parity count up
			// and if node length and parityCount matched, set active class to item
			settings.$pagingItems.each(function () {
				var $self = $(this),
					parityCount = 0,
					nodeLength = 0;

				$.each(settings.filterData, function (key, data) {
					if (data.length != 0) {
						$.each(data, function (index, value) {
							if ($self.data(key) == value) {
								parityCount++;
							}
						});
						nodeLength++;
					} else {
						delete settings.filterData[key];
					}
				});

				if (nodeLength == parityCount) {
					$self.addClass('is-active')
				} else {
					$self.removeClass('is-active')
				}
			});
		},

		/**
		 * @private _setAvailableFilterClass
		 */
		_setAvailableFilterClass: function () {
			var $self = this,
				settings = $self.data('pagination'),
				selector = settings.$pagingItems.parents(settings.wrapperClass).find('.is-active');

			// set active filter object
			settings.activeFilter = {};
			// get available filter options
			if (settings.showAttributeCount) {
				settings.activeFilter = methods._getFilterAttributesWithCounts.call($self, settings, selector);
			} else {
				settings.activeFilter = methods._getFilterAttributes.call($self, settings, selector);
			}
			// unbind click events
			settings.filterContainer.find('li:not(".is-active")').addClass('filter-not-available').off();

			// re-bind on click event on available filter options
			settings.filterContainer.find('.filter-not-available').each(function () {
				var $this = $(this),
					dataFilter = null,
					dataValue = null;
				// get data values
				$.each($this.data(), function (key, value) {
					dataFilter = key;
					dataValue = value;
				});

				// search for all available filter items which are selected
				$.each(settings.activeFilter, function (key, data) {
					$.each(data, function (index, value) {
						$.each(value, function (key, value) {
							var activeFilter = settings.filterContainer.find('.filter-' + index.toLowerCase() + ' .is-active[data-attribute=' + value[0] + ']');
							if (activeFilter.length) {
								activeFilter.find('span').text(value[0] + ' (' + value[1] + ')');
							}
							if ((settings.showAttributeCount && dataValue == value[0]) || (!settings.showAttributeCount && dataValue == value)) {
								$this.removeClass('filter-not-available').addClass('filter-available');
								if (settings.showAttributeCount) {
									$this.find('span').text(value[0] + ' (' + value[1] + ')');
								}
								$this.on('click', function (event) {
									event.stopImmediatePropagation();
									methods._bindFilterEvent.call($this, $self, dataFilter, dataValue);
								});
							} else if (settings.showAttributeCount && $this.hasClass('filter-not-available')) {
								$this.find('span').text($this.data('attribute') + ' (0)');
							}
						});
					});
				});
			});
		},

		/**
		 * @private _debug
		 * @param {Object} settings
		 */
		_debug: function (settings) {
			console.log('Object: ' + $(this).attr('class'));
			console.log('Items: ' + settings.items);
			console.log('Items per Page: ' + settings.itemsOnPage);
			console.log('Pages: ' + settings.pages);
			console.log('Current Page: ' + settings.currentPage);
			console.log('--------------------------------');
		}
	};


	$.fn.bra_pagination = function (method) {
		if (methods[method]) {
			return methods[ method ].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			// Default to "init"
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on jQuery.bra_pagination');
		}
	};

})(jQuery);