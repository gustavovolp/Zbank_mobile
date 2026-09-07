import Svg, { Path } from 'react-native-svg';
import { BOOTSTRAP_ICON_PATHS, type BootstrapIconName } from '../constants/bootstrapIcons';

interface BootstrapIconProps {
  name: BootstrapIconName;
  size?: number;
  color?: string;
}

export function BootstrapIcon({ name, size = 16, color = '#000000' }: BootstrapIconProps) {
  const paths = BOOTSTRAP_ICON_PATHS[name];

  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      {paths.map((path, index) => (
        <Path key={index} d={path.d} fillRule={'fillRule' in path ? path.fillRule : undefined} />
      ))}
    </Svg>
  );
}
