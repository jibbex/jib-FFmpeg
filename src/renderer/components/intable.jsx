import React, {useState, useEffect} from 'react';
import {
	Table, TableBody, TableFooter, TableCell, TableContainer, TableHead,
	TableRow, Paper, Button, Tooltip, CircularProgress, Fade, Zoom,
	Menu, MenuItem, Divider, ClickAwayListener, ListItemIcon, Container
} from '@material-ui/core';
import ClearAllIcon from '@material-ui/icons/ClearAll';
import FormatLineSpacingIcon from '@material-ui/icons/FormatLineSpacing';
import RemoveCircleIcon from '@material-ui/icons/RemoveCircle';
import AddIcon from '@material-ui/icons/NoteAdd';
import style from './intable.css';
import {Theme} from './../app.css';

const initMenuState = {
  mouseX: null,
  mouseY: null,
};

export default function InTable(props) {
	const [contextState, setContextState] = useState(initMenuState);
	const [isCtrlPressed, setIsCtrlPressed] = useState(false);
	const classes = style();

	useEffect(() => {
		function keyDownEvent(event) {
			if(event.which == '17') {
				setIsCtrlPressed(true);
			}
		}

		function keyUpEvent(event) {
			if(isCtrlPressed) {
				setIsCtrlPressed(false)
			}
		}

		document.addEventListener('keydown', keyDownEvent);
		document.addEventListener('keyup', keyUpEvent);

		return () => {
			document.removeEventListener('keydown',keyDownEvent);
			document.removeEventListener('keyup',keyUpEvent);
		}
	})

	function openContextMenu(event) {
		event.preventDefault();
		setContextState({
			mouseX: event.clientX - 2,
			mouseY: event.clientY - 4,
		});
	}

	function closeContextMenu(event) {
		setContextState(initMenuState);
	}

	function clearSelection(event) {
		closeContextMenu(event);
		props.actions.removeAllSelected();
	}

	function selectAll(event) {
		closeContextMenu(event);
		props.actions.selectAll();
	}

	function removeSelected(event) {
		closeContextMenu(event);
		props.actions.deleteSelected();
	}

	function add(event) {
		closeContextMenu(event);
		props.actions.add();
	}

	function rowClick(event, id) {
		if(isCtrlPressed) {
			props.actions.addSelected(event, id)
		}
		else [
			props.actions.click(event, id)
		]
	}

	const isSelected = (id) => props.selected.findIndex(i => i.id == id) !== -1;

	return (
		<div className={classes.root}>
			<TableContainer onContextMenu={props.loading ? null : openContextMenu} style={{ cursor: 'context-menu' }} className={classes.container} component={Paper} style={{height:'100%', borderRadius: 0, background: 'rgba(255,255,255,.9)'}}>
				<Fade in={props.loading}>
					<div className={classes.loadingContainer}>
						<div className={classes.loadingWrapper}>
							<CircularProgress color="secondary" />
						</div>
					</div>
				</Fade>
	      <Table stickyHeader className={classes.table} aria-label="caption table" >
	        <TableHead>
	          <TableRow>
	            <TableCell className={classes.th} style={{display: 'flex', alignItems: 'center'}}>
								<span style={{padding: '0px 15px 0 0'}}>{props.Buttons}</span>
								Filename
							</TableCell>
	            <TableCell className={classes.th} align="right">Size</TableCell>
	            <TableCell className={classes.th} align="right">Duration</TableCell>
	          </TableRow>
	        </TableHead>
	        <TableBody>
	          {props.files.map((row) => {
							const isItemSelected = isSelected(row.id);
							return (
		            <TableRow
										hover
										key={row.id}
										selected={isItemSelected}
										onClick={(ev) => rowClick(event, row.id)}>
		              <TableCell scope="row" style={{maxWidth: '250px', minWidth: 120, overflow: 'hidden', wordWrap: 'break-all'}}>
		                {row.name}
		              </TableCell>
		              <TableCell align="right">{row.size}</TableCell>
		              <TableCell align="right">{row.duration}</TableCell>
		            </TableRow>
							)
	          })}
	        </TableBody>
	      </Table>
	    </TableContainer>
			<ClickAwayListener onClickAway={closeContextMenu}>
				<Menu
		        keepMounted
		        open={contextState.mouseY !== null}
		        onClose={closeContextMenu}
		        anchorReference="anchorPosition"
		        anchorPosition={
		          contextState.mouseY !== null && contextState.mouseX !== null
		            ? { top: contextState.mouseY, left: contextState.mouseX }
		            : undefined
		        }
		      >
					<MenuItem onClick={add}>
						<ListItemIcon><AddIcon /></ListItemIcon>
						Add Files
					</MenuItem>
					<Divider />
					<MenuItem disabled={!props.files.length} onClick={selectAll}>
						<ListItemIcon><FormatLineSpacingIcon /></ListItemIcon>
						Select All
					</MenuItem>
					<MenuItem disabled={!props.selected.length} onClick={clearSelection}>
							<ListItemIcon><ClearAllIcon /></ListItemIcon>
						Clear Selection
					</MenuItem>
					<Divider />
					<MenuItem disabled={!props.selected.length} onClick={removeSelected}>
						<ListItemIcon style={{color: Theme.palette.error.main}}><RemoveCircleIcon /></ListItemIcon>
						Remove Selected
					</MenuItem>
	      </Menu>
			</ClickAwayListener>
		</div>
	);
}
