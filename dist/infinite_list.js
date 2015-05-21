!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.InfiniteList=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/** @jsx React.DOM */

var React = require('react');

var InfiniteListItem = React.createClass({displayName: "InfiniteListItem",
    render: function() {
        var classNames = 'infinite-list-item';

        return (
            React.createElement("div", {className: classNames, style: {height: this.props.height}}, 
                this.props.item.title
            )
        );
    }
});

module.exports = React.createClass({displayName: "exports",
    onScroll: function() {
        var scrolledPx = this.getDOMNode().scrollTop;

        var visibleStart = parseInt(scrolledPx / this.props.itemHeight);
        var visibleEnd = Math.min(visibleStart + this.props.numOfVisibleItems, this.props.items.length - 1);

        if (visibleStart !== this.state.renderedStart) {
            this._showItems(visibleStart, visibleEnd);
        }
    },

    renderFromStart: function () {
        this.getDOMNode().scrollTop = 0;

        this.setState({
            renderedStart: 0,
            renderedEnd: this.props.numOfVisibleItems
        });
    },

    _showItems: function(visibleStart, visibleEnd) {
        this.setState({
            renderedStart: visibleStart,
            renderedEnd: visibleEnd
        });
    },

    getInitialState: function() {
        return {
            selectionType: 'IN',
            selectionMap: {},
            renderedStart: 0,
            renderedEnd: this.props.numOfVisibleItems
        };
    },

    getDefaultProps: function() {
        return {
            handleSelection: true,
            multipleSelection: false,
            selection: [],
            selectionType: 'IN',
            selectionHandler: function (type, selection) {
                console.warn('You probably forgot to define selectionHandler on InfiniteList. | Internal selectionHandler: ', type, selection);
            }
        };
    },

    // borrowed from Ember
    _uuid: 0,

    _getGuid:  function () {
        return ++this._uuid;
    },

    guidFor: function (obj) {
        var stamp;
        var GUID_KEY = '__infID';

        var GUID_DESC = {
            writable: false,
            configurable: false,
            enumerable: false,
            value: null
        };

        if (obj[GUID_KEY]) return obj[GUID_KEY];
        if (obj === Object) return '(Object)';
        if (obj === Array)  return '(Array)';
        stamp = 'inf-' + this._getGuid();

        if (obj[GUID_KEY] === null) {
            obj[GUID_KEY] = stamp;
        } else {
            GUID_DESC.value = stamp;
            Object.defineProperty(obj, GUID_KEY, GUID_DESC);
        }

        return stamp;
    },

    componentWillReceiveProps: function (nextProps) {
        this.setSelection(nextProps.selection, false);
    },

    componentWillMount: function () {
        if (!this.props.handleSelection) return;
        this.setSelection(this.props.selection, true);
    },

    // handler for click on item
    itemClickHandler: function (item, only, e) {
        if (!this.props.handleSelection) return;
        only && e.stopPropagation();
        this._toggleSelection(item, only);
    },

    // toggles item selection
    _toggleSelection: function(item, only) {
        var selectionMap = this.state.selectionMap;
        var itemGuid = this.guidFor(item);

        if (only) {
            selectionMap = {};
            selectionMap[itemGuid] = item;
        }else{
            if (this.props.multipleSelection) {
                if (itemGuid in selectionMap) {
                    delete selectionMap[itemGuid];
                } else {
                    selectionMap[itemGuid] = item;
                }
            } else {
                if (itemGuid in selectionMap) {
                    selectionMap = {};
                } else {
                    selectionMap = {};
                    selectionMap[itemGuid] = item;
                }
            }
        }

        this._propagateSelection(selectionMap);
    },

    // propagates items selection and calls callback
    _propagateSelection: function (selectionMap) {
        this.setState({
            selectionMap: selectionMap
        }, function () {
            var cb = this.props.selectionHandler;

            cb && cb(
                this.state.selectionType,
                this._getSelectionArray()
            );
        });
    },

    setSelection: function (selection, propagate) {
        var selectionMap = {};

        // propagate selection to map
        if (this.allIsSelected(selection)) {
            var selectionType = 'NOT';
        }else{
            selection.forEach(function(item) {
                selectionMap[this.guidFor(item)] = item;
            }.bind(this));
        }

        this.setState({
            selectionType: selectionType || this.props.selectionType,
            selectionMap: selectionMap
        }, function () {
            propagate && this._propagateSelection(selectionMap);
        });
    },

    _getSelectionArray: function () {
        var selectionMap = this.state.selectionMap || {},
            selection = [];

        Object.keys(selectionMap).forEach(function(key) {
            selection.push(selectionMap[key]);
        });

        return selection;
    },

    allIsSelected: function (selection) {
        return this.props.items.length === selection.length;
    },

    _getListItemClass: function() {
        if (this.props.listItemClass) {
            return this.props.listItemClass;
        } else {
            return InfiniteListItem;
        }
    },

    render: function() {
        var itemsToRender = {};
        var ItemClass = this._getListItemClass();
        var height = this.props.itemHeight;
        var onlyVisible = this.props.onlyVisible;

        itemsToRender['top'] = (
            React.createElement("div", {className: "topitem", 
                style: {height: this.state.renderedStart * this.props.itemHeight}}));

        for (var i = this.state.renderedStart; i <= this.state.renderedEnd; i++) {
            var item = this.props.items[i];

            var boundClick = this.itemClickHandler.bind(this, item, false);
            var boundOnlyClick = this.itemClickHandler.bind(this, item, true);

            // selection
            var inMap = this.guidFor(item) in this.state.selectionMap;
            var selected = this.state.selectionType === 'NOT' ? !inMap : inMap;

            itemsToRender['item ' + i] = (
                React.createElement(ItemClass, {
                    item: item, 
                    height: height, 
                    selected: selected, 
                    onlyVisible: onlyVisible, 
                    clickHandler: boundClick, 
                    onlyClickHandler: boundOnlyClick})
            );
        }

        return (
            React.createElement("div", {className: "infinite-list", onScroll: this.onScroll, 
                style: {height: this.props.itemHeight * this.props.numOfVisibleItems}}, 
                React.createElement("div", {className: "infinite-list-content", 
                    style: {height: this.props.items.length * this.props.itemHeight}}, 
                    itemsToRender
                )
            )
        );
    }
});
},{"react":"react"}]},{},[1])(1)
});