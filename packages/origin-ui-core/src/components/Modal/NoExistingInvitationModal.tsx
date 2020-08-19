import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogActions, Button, Box, Grid } from '@material-ui/core';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { getInvitations, getUserOffchain } from '../../features/users/selectors';
import { useTranslation } from '../..';
import { Trans } from 'react-i18next';
import DraftOutlineIcon from '@material-ui/icons/DraftsOutlined';

export const NoExistingInvitationModal = () => {

    const [isOpen, setIsOpen] = useState(true)
    const invitations = useSelector(getInvitations);
    const user = useSelector(getUserOffchain);
    const history = useHistory();
    const { t } = useTranslation();
    const firstLogin = JSON.parse(localStorage.getItem('firstLogin')) === null;

    const checkUser = () => user !== null ? user && !user.organization : false
    const showMessage = !invitations.length && checkUser() && isOpen && firstLogin;

    const notNow = () => {
        setIsOpen(false)
        localStorage.setItem('firstLogin', 'false')
    };

    const register = () => {
        history.push("/organization/organization-register")
        setIsOpen(false) 
        localStorage.setItem('firstLogin', 'false')
    };

    return (
    <Dialog open={showMessage}>
            <DialogTitle>
            <Grid container>
                <Grid item xs={2}>
                        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
                            <DraftOutlineIcon
                                color="primary"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    position: 'absolute',
                                    top: 0
                                }} />
                        </div>
                </Grid>
                    <Grid item xs>
                        <Box pl={2}>
                            {t('organization.invitations.dialog.noInvitationModalTitle')}
                            <br />
                            <br />
                            <Box fontSize={'16px'}>
                                <Trans
                                    i18nKey="organization.invitations.dialog.noInvitationMessage"
                                />
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </DialogTitle>
            <DialogActions style={{padding:'20px'}}>
                    <Button variant="outlined" color="primary" onClick={() => notNow()}>
                        {t('organization.invitations.actions.notNow')}
                    </Button>
                    <Button variant="contained" color="primary" onClick={() => register()}>
                        {t('organization.invitations.actions.registerOrganization')}
                    </Button>
                </DialogActions>
        </Dialog>)
    
}