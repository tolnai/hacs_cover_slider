import { css } from 'lit';

export default css`
  .toolbar {
    display: flex;
    border-bottom: 1px solid var(--divider-color);
  }
  .tab {
    flex: 1;
    padding: 12px 16px;
    border: none;
    border-bottom: 2px solid transparent;
    background: none;
    color: var(--secondary-text-color);
    font: inherit;
    font-weight: 500;
    cursor: pointer;
  }
  .tab:hover {
    color: var(--primary-text-color);
  }
  .tab.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
  }
  .box {
    margin-top: 8px;
    border: 1px solid var(--divider-color);
    padding: 12px;
  }
`;
