import * as React from 'react';
import {Hidden, Drawer } from '@material-ui/core';
import clsx from 'clsx';

export default function ResponsiveDrawer(props) {
	const {
  children,
  elevation = 12,
  open,
  onClose,
  anchor = 'left',
  classes,
  className
 } = props;

	return (
		<React.Fragment>
			<Hidden only={['lg', 'xl']} implementation="css">
				<Drawer
     		anchor={anchor}
				variant="persistent"
			  className={className}
			  open={open}
			  onClose={onClose}
				ModalProps={{
							keepMounted: true,
				}}
	      classes={{
	       paper: classes.drawerPaper,
	      }}>
					 {...children}
				</Drawer>
			</Hidden>
   <Hidden only={['xs', 'md']} implementation="css">
     <Drawer
       anchor={anchor}
       variant="permanent"
       className={className}
       elevation={elevation}
       classes={{
         paper: classes.drawerPaper,
       }}>
        {...children}
     </Drawer>
   </Hidden>
		</React.Fragment>
	);
}
