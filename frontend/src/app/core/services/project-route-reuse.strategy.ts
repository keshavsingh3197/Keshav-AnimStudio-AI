import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, BaseRouteReuseStrategy } from '@angular/router';

/**
 * Never reuses a screen across two projects.
 *
 * The router's default reuses a component whenever the route config matches, so moving
 * from /projects/A/clips to /projects/B/clips kept the same editor, the same ProjectStore
 * and the same video-editor state - and project A's timeline, clips and render polling
 * carried straight on inside project B. Treating a different :projectId as a different
 * route tears the whole project subtree down and builds it again, so per-project state
 * starts empty by construction rather than by every screen remembering to reset itself.
 */
@Injectable()
export class ProjectRouteReuseStrategy extends BaseRouteReuseStrategy {
  override shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return super.shouldReuseRoute(future, curr)
      && future.paramMap.get('projectId') === curr.paramMap.get('projectId');
  }
}
