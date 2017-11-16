const getSVGIconHTML = (name, tag = 'div') => {
  if (typeof name === 'undefined') {
    console.error('name for SVG-icon is required');
    return false;
  }

  return `<${tag} class="svg-icon svg-icon--${name}">
      <svg class="svg-icon__link">
        <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#${name}"></use>
      </svg>
    </${tag}>`;
};
