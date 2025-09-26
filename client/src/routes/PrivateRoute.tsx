import React from 'react'
import { Outlet } from 'react-router-dom';

interface PrivateRouteProps {
  allowedRoles: string[];
}
function PrivateRoute({ allowedRoles }: PrivateRouteProps) {
  return (
    console.log('PrivateRoute - allowedRoles:', allowedRoles),
  <Outlet />);
}

export default PrivateRoute


