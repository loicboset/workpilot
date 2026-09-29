import { PageTitle, type PageTitleProps } from '@/components/PageTitle'
import { useSpacePath } from './useSpacePath'

/** A page's title in a space: its arrow goes back to the space's homepage. */
export const SpacePageTitle = (props: Omit<PageTitleProps, 'backHref'>) => {
  // HOOKS
  const spacePath = useSpacePath()

  return <PageTitle {...props} backHref={spacePath()} />
}
