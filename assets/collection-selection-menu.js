class CollectionSelectionMenu extends HTMLElement {
  constructor() {
    super();
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll('li.link a').forEach((link) =>
      link.addEventListener('click', (event) => {
        event.preventDefault();
        this.onMenuLinkClickHandler(event);
      })
    );

    this.querySelector('.mobile-menu-toggle').addEventListener('click', (event) => {
      event.preventDefault();
      this.onMenuToggleClickHandler();
    });
  }

  onMenuLinkClickHandler(event) {
    const windowLocationSearch = CollectionSelectionMenu.resetPageNum(window.location.search);
    const relativePathWithQuery = event.target.getAttribute('href') + windowLocationSearch;

    if (CollectionSelectionMenu.linksEnabled) {
      CollectionSelectionMenu.linksEnabled = false;
      CollectionSelectionMenu.showMobileMenu(false);
      CollectionSelectionMenu.toggleActiveLink(event);
      CollectionSelectionMenu.toggleLoader(true);
      CollectionSelectionMenu.updateTitle(event);
      CollectionSelectionMenu.renderPage(relativePathWithQuery, event);
    }
  }

  onMenuToggleClickHandler() {
    CollectionSelectionMenu.showMobileMenu(!CollectionSelectionMenu.mobileMenuShow);
  }

  static linksEnabled = true;
  static mobileMenuShow = false;

  static setListeners() {
    const onHistoryChange = (event) => {
      const relativePathWithQuery = event.state
        ? event.state.relativePathWithQuery
        : CollectionSelectionMenu.relativePathWithQueryInitial;
      if (relativePathWithQuery === CollectionSelectionMenu.relativePathWithQueryPrev) return;
      CollectionSelectionMenu.renderPage(relativePathWithQuery, null, false);
    };
    window.addEventListener('popstate', onHistoryChange);
  }

  static showMobileMenu(show = true) {
    const menuToggleLink = document.getElementById('CollectionCategoryMenu').querySelector('.mobile-menu-toggle');
    const menuLinkList = document.getElementById('CollectionCategoryMenu').querySelector('.menu-container ul');

    CollectionSelectionMenu.mobileMenuShow = show;

    if (CollectionSelectionMenu.mobileMenuShow) {
      menuToggleLink.classList.add('active');
      menuLinkList.classList.add('mobile-show');
    } else {
      menuToggleLink.classList.remove('active');
      menuLinkList.classList.remove('mobile-show');
    }
  }

  static resetPageNum(windowLocationSearch) {
    if (windowLocationSearch.includes('page=')) {
      windowLocationSearch = windowLocationSearch.replace(/(page=)[^\&]+/, '$1' + '1');
    }

    return windowLocationSearch;
  }

  static toggleActiveLink(event) {
    const menuLinks = document.getElementById('CollectionCategoryMenu').querySelectorAll('.link');

    menuLinks.forEach((menuLink) => menuLink.classList.remove('active'));
    event.target.parentElement.classList.add('active');
  }

  static toggleLoader(showLoader = false) {
    const collectionBanner = document.getElementById('collectionBanner');
    const productGridContainerCollection = document.getElementById('ProductGridContainer').querySelector('.collection');
    const countContainer = document.getElementById('ProductCount');
    const countContainerDesktop = document.getElementById('ProductCountDesktop');
    const loadingSpinners = document.querySelectorAll(
      '.facets-container .loading__spinner, facet-filters-form .loading__spinner'
    );

    if (showLoader) {
      if (collectionBanner) {
        collectionBanner.classList.add('loading');
      }

      if (productGridContainerCollection) {
        productGridContainerCollection.classList.add('loading');
      }

      if (countContainer) {
        countContainer.classList.add('loading');
      }

      if (countContainerDesktop) {
        countContainerDesktop.classList.add('loading');
      }

      loadingSpinners.forEach((spinner) => spinner.classList.remove('hidden'));
    } else {
      if (collectionBanner) {
        collectionBanner.classList.remove('loading');
      }

      if (productGridContainerCollection) {
        productGridContainerCollection.classList.remove('loading');
      }

      if (countContainer) {
        countContainer.classList.remove('loading');
      }

      if (countContainerDesktop) {
        countContainerDesktop.classList.remove('loading');
      }

      loadingSpinners.forEach((spinner) => spinner.classList.add('hidden'));
    }
  }

  static updateTitle(event) {
    const currentTitle = document.title;
    const categoryNameArr = event.target.getAttribute('href').split('/').pop().split('-');
    const categoryName = categoryNameArr.map((word) => word[0].toUpperCase() + word.slice(1)).join(' ');

    document.title = categoryName + ' – ' + currentTitle.split('–').pop();
  }

  static getRenderSections() {
    return [
      {
        elementId: 'collectionBanner',
        section: document.getElementById('collectionBanner').dataset.id,
      },
      {
        elementId: 'ProductGridContainer',
        section: document.getElementById('ProductGridContainer').querySelector('.collection').dataset.id,
      },
    ];
  }

  static renderPage(relativePathWithQuery, event, updateURLHash = true) {
    CollectionSelectionMenu.relativePathWithQueryPrev = relativePathWithQuery;
    const sectionsToRender = CollectionSelectionMenu.getRenderSections();

    sectionsToRender.forEach((section) => {
      const elementId = section.elementId;
      const url = relativePathWithQuery.includes('?')
        ? `${relativePathWithQuery}&section_id=${section.section}`
        : `${relativePathWithQuery}?section_id=${section.section}`;
      const collectionDataKey = elementId + ':' + url;
      const filterDataByKey = (element) => element.collectionDataKey === collectionDataKey;

      CollectionSelectionMenu.collectionData.some(filterDataByKey)
        ? CollectionSelectionMenu.renderSectionFromCache(elementId, filterDataByKey, event)
        : CollectionSelectionMenu.renderSectionFromFetch(elementId, url, event);
    });

    if (updateURLHash) CollectionSelectionMenu.updateURLHash(relativePathWithQuery);
  }

  static renderSectionFromFetch(elementId, url, event) {
    const collectionDataKey = elementId + ':' + url;
    fetch(url)
      .then((response) => response.text())
      .then((responseText) => {
        const html = responseText;

        CollectionSelectionMenu.collectionData = [
          ...CollectionSelectionMenu.collectionData,
          { html, collectionDataKey },
        ];

        CollectionSelectionMenu.renderContainerHtml(elementId, html);
      });
  }

  static renderSectionFromCache(elementId, collectionDataKey, event) {
    const html = CollectionSelectionMenu.collectionData.find(collectionDataKey).html;

    CollectionSelectionMenu.renderContainerHtml(elementId, html);
  }

  static renderContainerHtml(elementId, html) {
    if (elementId === 'collectionBanner') {
      CollectionSelectionMenu.renderCollectionBanner(html);
    } else if (elementId === 'ProductGridContainer') {
      CollectionSelectionMenu.renderProductGridContainer(html);
      CollectionSelectionMenu.renderProductCount(html);
      CollectionSelectionMenu.toggleLoader(false);
      if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);
      CollectionSelectionMenu.linksEnabled = true;
    }
  }

  static renderCollectionBanner(html) {
    document.getElementById('collectionBanner').innerHTML = new DOMParser()
      .parseFromString(html, 'text/html')
      .getElementById('collectionBanner').innerHTML;
  }

  static renderProductGridContainer(html) {
    document.getElementById('ProductGridContainer').innerHTML = new DOMParser()
      .parseFromString(html, 'text/html')
      .getElementById('ProductGridContainer').innerHTML;

    document
      .getElementById('ProductGridContainer')
      .querySelectorAll('.scroll-trigger')
      .forEach((element) => {
        element.classList.add('scroll-trigger--cancel');
      });
  }

  static renderProductCount(html) {
    const count = new DOMParser().parseFromString(html, 'text/html').getElementById('ProductCount').innerHTML;
    const container = document.getElementById('ProductCount');
    const containerDesktop = document.getElementById('ProductCountDesktop');

    container.innerHTML = count;

    if (containerDesktop) {
      containerDesktop.innerHTML = count;
    }
  }

  static renderCounts(source, target) {
    const targetSummary = target.querySelector('.facets__summary');
    const sourceSummary = source.querySelector('.facets__summary');

    if (sourceSummary && targetSummary) {
      targetSummary.outerHTML = sourceSummary.outerHTML;
    }

    const targetHeaderElement = target.querySelector('.facets__header');
    const sourceHeaderElement = source.querySelector('.facets__header');

    if (sourceHeaderElement && targetHeaderElement) {
      targetHeaderElement.outerHTML = sourceHeaderElement.outerHTML;
    }

    const targetWrapElement = target.querySelector('.facets-wrap');
    const sourceWrapElement = source.querySelector('.facets-wrap');

    if (sourceWrapElement && targetWrapElement) {
      const isShowingMore = Boolean(target.querySelector('show-more-button .label-show-more.hidden'));
      if (isShowingMore) {
        sourceWrapElement
          .querySelectorAll('.facets__item.hidden')
          .forEach((hiddenItem) => hiddenItem.classList.replace('hidden', 'show-more-item'));
      }

      targetWrapElement.outerHTML = sourceWrapElement.outerHTML;
    }
  }

  static renderMobileCounts(source, target) {
    const targetFacetsList = target.querySelector('.mobile-facets__list');
    const sourceFacetsList = source.querySelector('.mobile-facets__list');

    if (sourceFacetsList && targetFacetsList) {
      targetFacetsList.outerHTML = sourceFacetsList.outerHTML;
    }
  }

  static updateURLHash(relativePathWithQuery) {
    history.pushState({ relativePathWithQuery }, '', `${relativePathWithQuery}`);
  }

  createSearchParams(form) {
    const formData = new FormData(form);
    return new URLSearchParams(formData).toString();
  }
}

CollectionSelectionMenu.collectionData = [];
CollectionSelectionMenu.relativePathWithQueryInitial = window.location.pathname + window.location.search;
CollectionSelectionMenu.relativePathWithQueryPrev = window.location.pathname + window.location.search;
customElements.define('collection-selection-menu', CollectionSelectionMenu);
CollectionSelectionMenu.setListeners();
