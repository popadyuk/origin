import React, { useEffect, useState } from 'react';
import {
    useTranslation,
    EnergyFormatter,
    formatCurrencyComplete,
    moment,
    deviceById
} from '../../utils';
import { Order } from '../../utils/exchange';
import {
    IPaginatedLoaderHooksFetchDataParameters,
    IPaginatedLoaderFetchDataReturnValues,
    usePaginatedLoaderFiltered,
    TableMaterial,
    checkRecordPassesFilters,
    ICustomFilterDefinition,
    CustomFilterInputType,
    FilterRules
} from '../Table';
import { useSelector } from 'react-redux';
import { getCurrencies, getConfiguration, getEnvironment, getProducingDevices } from '../..';
import { BigNumber } from 'ethers/utils';
import { Remove, Visibility } from '@material-ui/icons';
import { RemoveOrderConfirmation } from '../Modal/RemoveOrderConfirmation';
import { AskDetailsModal } from '../Modal/AskDetailslModal';

const ORDERS_PER_PAGE = 25;

interface IOwnProsp {
    asks: Order[];
}

export const AsksTable = (props: IOwnProsp) => {
    const { asks } = props;
    const { t } = useTranslation();
    const [askToView, setToView] = useState<Order>();
    const [askToRemove, setToRemove] = useState<Order>();
    const configuration = useSelector(getConfiguration);
    const deviceTypeService = configuration?.deviceTypeService;
    const environment = useSelector(getEnvironment);
    const devices = useSelector(getProducingDevices);

    const columns = [
        { id: 'volume', label: t('order.properties.volume') },
        { id: 'price', label: t('order.properties.price') },
        { id: 'facilityName', label: t('device.properties.facilityName') },
        { id: 'generationFrom', label: t('order.properties.generation_start') },
        { id: 'generationTo', label: t('order.properties.generation_end') },
        { id: 'filled', label: t('order.properties.filled') }
    ];

    const getFilters = (): ICustomFilterDefinition[] => [
        {
            property: (record: Order) =>
                deviceById(record.product.externalDeviceId.id, environment, devices).facilityName,
            label: t('device.properties.facilityName'),
            input: {
                type: CustomFilterInputType.dropdown,
                availableOptions: devices.map((device) => ({
                    label: device.facilityName,
                    value: device.facilityName
                }))
            }
        },
        {
            property: (record: Order) => record.product.deviceType[0],
            label: t('certificate.properties.deviceType'),
            input: {
                type: CustomFilterInputType.deviceType,
                defaultOptions: []
            }
        },
        {
            property: (record: Order) => new Date(record.product.generationFrom).getTime() / 1000,
            label: t('certificate.properties.generationDateStart'),
            input: {
                type: CustomFilterInputType.yearMonth,
                filterRule: FilterRules.FROM
            }
        },
        {
            property: (record: Order) => new Date(record.product.generationTo).getTime() / 1000,
            label: t('certificate.properties.generationDateEnd'),
            input: {
                type: CustomFilterInputType.yearMonth,
                filterRule: FilterRules.TO
            }
        }
    ];

    async function getPaginatedData({
        requestedPageSize,
        offset,
        requestedFilters
    }: IPaginatedLoaderHooksFetchDataParameters): Promise<IPaginatedLoaderFetchDataReturnValues> {
        const filteredBids = asks.filter((bid) => {
            return checkRecordPassesFilters(bid, requestedFilters, deviceTypeService);
        });
        return {
            paginatedData: filteredBids.slice(offset, offset + requestedPageSize),
            total: filteredBids.length
        };
    }

    const { paginatedData, loadPage, total, pageSize, setPageSize } = usePaginatedLoaderFiltered<
        Order
    >({
        getPaginatedData,
        initialPageSize: ORDERS_PER_PAGE
    });

    useEffect(() => {
        setPageSize(ORDERS_PER_PAGE);
        loadPage(1);
    }, [asks]);

    const [currency = 'USD'] = useSelector(getCurrencies);

    const rows = paginatedData.map((order) => {
        const {
            startVolume,
            currentVolume,
            price,
            product: {
                deviceType,
                generationFrom,
                generationTo,
                externalDeviceId: { id: extDevId }
            }
        } = order;
        return {
            volume: EnergyFormatter.format(Number(currentVolume), true),
            price: formatCurrencyComplete(price / 100, currency),
            facilityName: deviceById(extDevId, environment, devices).facilityName,
            device_type: deviceType[0].split(';')[0],
            generationFrom: moment(generationFrom).format('MMM, YYYY'),
            generationTo: moment(generationTo).format('MMM, YYYY'),
            filled: `${
                new BigNumber(startVolume)
                    .sub(new BigNumber(currentVolume))
                    .mul(100)
                    .div(startVolume)
                    .toNumber() / 100
            }%`,
            askId: order.id
        };
    });

    const viewDetails = (rowIndex: number) => {
        const { askId } = rows[rowIndex];
        const ask = asks.find((o) => o.id === askId);
        setToView(ask);
    };

    const removeAsk = (rowIndex: number) => {
        const { askId } = rows[rowIndex];
        const ask = asks.find((o) => o.id === askId);
        setToRemove(ask);
    };

    const actions = [
        {
            icon: <Visibility />,
            name: 'View',
            onClick: (row: string) => viewDetails(parseInt(row, 10))
        },
        {
            icon: <Remove />,
            name: 'Remove',
            onClick: (row: string) => removeAsk(parseInt(row, 10))
        }
    ];

    return (
        <>
            <TableMaterial
                columns={columns}
                rows={rows}
                filters={getFilters()}
                loadPage={loadPage}
                total={total}
                pageSize={pageSize}
                actions={actions}
                caption={t('order.info.open_asks')}
            />
            {askToView && <AskDetailsModal ask={askToView} close={() => setToView(null)} />}
            {askToRemove && (
                <RemoveOrderConfirmation order={askToRemove} close={() => setToRemove(null)} />
            )}
        </>
    );
};
