import styles from './Avatar.module.css';

function Avatar({ name, src, size = 'medium', className = '' }) {
  const initials = name
    ? name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const classNames = [styles.avatar, styles[size], className]
    .filter(Boolean)
    .join(' ');

  if (src) {
    return (
      <img src={src} alt={name || 'Avatar'} className={classNames} />
    );
  }

  return (
    <div className={classNames} title={name}>
      {initials}
    </div>
  );
}

export default Avatar;
