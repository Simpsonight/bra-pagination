bra_pagination
==============

A complex jQuery pagination and filter plugin


## Available options

OPTION | TYPE | DEFAULT | DESCRIPTION
--- | --- | --- | ---
**namespace** | String  | 'bra-' | Prefix string attached to the class of every element generated by the plugin
**itemSelector** | String | '.items' | Class-Selector: Items who should be used for the paging
**itemsOnPage** | Integer | 9 | Number of active items on every page
**currentPage** | Integer | 1 | Page to be started
**controlsContainer** | Object | null | jQuery Object whose contains the control navigation - example: $('.pagingContainer')
**maxDisplayedButtons** | Integer | 3 | Number of Buttons who should be shown - excluding minEndButtons!
**minEndButtons** | Integer | 2 | Number of Buttons at the begin and end of paging navigation who should be shown
**firstLastButton** | Boolean | true | Show first and last navigation buttons
**prevText** | String | '<' | Set the text for the "previous" directionNav item
**nextText** | String | '>' | Set the text for the "next" directionNav item
**firstText** | String | '<<' | Set the text for the "go to first" directionNav item
**lastText** | String | '>>' | Set the text for the "go to last" directionNav item
**ellipseText** | String | '&hellip;' | Set the text for the "placeholder" direction items
**filter** | Boolean | false | Set to true if items should be filtered
**filterContainer** | Object | null | jQuery Object whose contains the filter modules - example: $('.filterContainer')
**filterWrapperSelector** | String | '.filter-wrapper' | Class-Selector name who be used for each filter wrapper
**filterResetButtons** | String | '.filter-reset' | Class-Selector name for reset button
**filterResetText** | String | 'Filter zurücksetzen' | Set text for the filter reset button
**showAttributeCount** | Boolean | false | Displays the number of filtered items 
**search** | Boolean | false | Set to true if items could be searched
**searchSelector** | String | '#bra-input-search' | Selector for the search input field
**onInit** | Function | Optional | Callback triggered immediately after initialization
**onFilter** | Function | Optional | Callback triggered after filter toggle
**onFilterReset** | Function | Optional | Callback triggered after filter reset
**onUpdate** | Function | Optional | Callback triggered after update

## Available methods

### prevPage
Selects the previous page.
```javascript
$([selector]).bra_pagination('prevPage');
```
==============
### nextPage
Selects the next page
```javascript
$([selector]).bra_pagination('prevPage');
```
==============
### updateItemsOnPage
Allows to dynamically change how many items are rendered on each page
```javascript
$([selector]).bra_pagination('updateItemsOnPage', 20);
```
==============
### update
The pagination is drawn again using the existing settings. (useful after you have destroyed a paginationfor example). Methode is also used by the search function 
```javascript
$([selector]).bra_pagination('update');
```
==============
### destroy
Visually destroys the pagination, any existing settings are kept
```javascript
$([selector]).bra_pagination('destroy');
```
==============
### getPagesCount
Returns the total number of pages.
```javascript
$([selector]).bra_pagination('getPagesCount');
```
==============
### getCurrentPage
Returns the current page number.
```javascript
$([selector]).bra_pagination('getCurrentPage');
```
==============
### filterReset
Restore all filter settings
```javascript
$([selector]).bra_pagination('filterReset');
```
==============
### filterToggle
Activate or deactivate items by given filter options ([data attribute name], [data value])
```javascript
$([selector]).bra_pagination('filterToggle', 'filter-pattern-color', 'blue');
```
==============
### sortItems
Sorts the elements according to given parameters. Alphabetic or numeric, and either ascending or descending.
Must be an array with two values! ([  [sort property], [sorting] ])
```javascript
$([selector]).bra_pagination('sortItems', ['price', 'asc']);
```
**Available sort properties:**

PROPERTY | EXAMPLE | DESCRIPTION
--- | --- | ---
text | text | sort items by text
[data-attribute-name] | 'price' | sort items by data-attribute 'price'
.class | '.item' | sort items by class name  - must start with '.'

**Available sort order properties:**

PROPERTY | DESCRIPTION
--- | ---
asc | sort ascending
desc | sort descending
==============
