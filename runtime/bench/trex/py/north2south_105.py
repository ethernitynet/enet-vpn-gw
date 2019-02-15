from trex_stl_lib.api import *


##################
total_Mbps = 5000
frame_len = 600
streams_count = 4
vtep_dips_count = 1
vxlan_vni_min = 6106
guest_vlan_min = 10
guest_prio_min = 0
guest_vlans_count = 1
guest_prios_count = 1
guest_sips_count = 65536
guest_dips_count = 65536
##########################################
vxlan_sip_x = "10.0.1.5"
##########################################
vtep_dip_min =                       10
vtep_dip_min = (vtep_dip_min << 8) + 0
vtep_dip_min = (vtep_dip_min << 8) + 2
vtep_dip_min = (vtep_dip_min << 8) + 4
##########################################
guest_sip_min =                        1
guest_sip_min = (guest_sip_min << 8) + 1
guest_sip_min = (guest_sip_min << 8) + 1
guest_sip_min = (guest_sip_min << 8) + 1
##########################################
guest_dip_min =                        10
guest_dip_min = (guest_dip_min << 8) + 10
guest_dip_min = (guest_dip_min << 8) + 0
guest_dip_min = (guest_dip_min << 8) + 1
##########################################


###############################################################################################
###############################################################################################
# DO NOT EDIT BELOW THIS LINE
###############################################################################################
###############################################################################################
ssdp_payload_list = [
'3c', '3f', '78', '6d', '6c', '20', '76', '65', '72', '73', '69', '6f', '6e', '3d', '22', '31',
'2e', '30', '22', '20', '65', '6e', '63', '6f', '64', '69', '6e', '67', '3d', '22', '75', '74',
'66', '2d', '38', '22', '20', '3f', '3e', '3c', '73', '6f', '61', '70', '3a', '45', '6e', '76',
'65', '6c', '6f', '70', '65', '20', '78', '6d', '6c', '6e', '73', '3a', '73', '6f', '61', '70',
'3d', '22', '68', '74', '74', '70', '3a', '2f', '2f', '77', '77', '77', '2e', '77', '33', '2e',
'6f', '72', '67', '2f', '32', '30', '30', '33', '2f', '30', '35', '2f', '73', '6f', '61', '70',
'2d', '65', '6e', '76', '65', '6c', '6f', '70', '65', '22', '20', '78', '6d', '6c', '6e', '73',
'3a', '77', '73', '61', '3d', '22', '68', '74', '74', '70', '3a', '2f', '2f', '73', '63', '68',
'65', '6d', '61', '73', '2e', '78', '6d', '6c', '73', '6f', '61', '70', '2e', '6f', '72', '67',
'2f', '77', '73', '2f', '32', '30', '30', '34', '2f', '30', '38', '2f', '61', '64', '64', '72',
'65', '73', '73', '69', '6e', '67', '22', '20', '78', '6d', '6c', '6e', '73', '3a', '77', '73',
'64', '3d', '22', '68', '74', '74', '70', '3a', '2f', '2f', '73', '63', '68', '65', '6d', '61',
'73', '2e', '78', '6d', '6c', '73', '6f', '61', '70', '2e', '6f', '72', '67', '2f', '77', '73',
'2f', '32', '30', '30', '35', '2f', '30', '34', '2f', '64', '69', '73', '63', '6f', '76', '65',
'72', '79', '22', '20', '78', '6d', '6c', '6e', '73', '3a', '77', '73', '64', '70', '3d', '22',
'68', '74', '74', '70', '3a', '2f', '2f', '73', '63', '68', '65', '6d', '61', '73', '2e', '78',
'6d', '6c', '73', '6f', '61', '70', '2e', '6f', '72', '67', '2f', '77', '73', '2f', '32', '30',
'30', '36', '2f', '30', '32', '2f', '64', '65', '76', '70', '72', '6f', '66', '22', '20', '78',
'6d', '6c', '6e', '73', '3a', '77', '70', '72', '74', '3d', '22', '68', '74', '74', '70', '3a',
'2f', '2f', '73', '63', '68', '65', '6d', '61', '73', '2e', '6d', '69', '63', '72', '6f', '73',
'6f', '66', '74', '2e', '63', '6f', '6d', '2f', '77', '69', '6e', '64', '6f', '77', '73', '2f',
'32', '30', '30', '36', '2f', '30', '38', '2f', '77', '64', '70', '2f', '70', '72', '69', '6e',
'74', '22', '20', '78', '6d', '6c', '6e', '73', '3a', '77', '73', '63', '6e', '3d', '22', '68',
'74', '74', '70', '3a', '2f', '2f', '73', '63', '68', '65', '6d', '61', '73', '2e', '6d', '69',
'63', '72', '6f', '73', '6f', '66', '74', '2e', '63', '6f', '6d', '2f', '77', '69', '6e', '64',
'6f', '77', '73', '2f', '32', '30', '30', '36', '2f', '30', '38', '2f', '77', '64', '70', '2f',
'73', '63', '61', '6e', '22', '20', '78', '6d', '6c', '6e', '73', '3a', '78', '6f', '70', '3d',
'22', '68', '74', '74', '70', '3a', '2f', '2f', '77', '77', '77', '2e', '77', '33', '2e', '6f',
'72', '67', '2f', '32', '30', '30', '34', '2f', '30', '38', '2f', '78', '6f', '70', '2f', '69',
'6e', '63', '6c', '75', '64', '65', '22', '20', '3e', '3c', '73', '6f', '61', '70', '3a', '48',
'65', '61', '64', '65', '72', '3e', '3c', '77', '73', '61', '3a', '54', '6f', '3e', '68', '74',
'74', '70', '3a', '2f', '2f', '73', '63', '68', '65', '6d', '61', '73', '2e', '78', '6d', '6c',
'73', '6f', '61', '70', '2e', '6f', '72', '67', '2f', '77', '73', '2f', '32', '30', '30', '34',
'2f', '30', '38', '2f', '61', '64', '64', '72', '65', '73', '73', '69', '6e', '67', '2f', '72',
'6f', '6c', '65', '2f', '61', '6e', '6f', '6e', '79', '6d', '6f', '75', '73', '3c', '2f', '77',
'73', '61', '3a', '54', '6f', '3e', '3c', '77', '73', '61', '3a', '41', '63', '74', '69', '6f',
'6e', '3e', '68', '74', '74', '70', '3a', '2f', '2f', '73', '63', '68', '65', '6d', '61', '73',
'2e', '78', '6d', '6c', '73', '6f', '61', '70', '2e', '6f', '72', '67', '2f', '77', '73', '2f',
'32', '30', '30', '35', '2f', '30', '34', '2f', '64', '69', '73', '63', '6f', '76', '65', '72',
'79', '2f', '52', '65', '73', '6f', '6c', '76', '65', '4d', '61', '74', '63', '68', '65', '73',
'3c', '2f', '77', '73', '61', '3a', '41', '63', '74', '69', '6f', '6e', '3e', '3c', '77', '73',
'61', '3a', '4d', '65', '73', '73', '61', '67', '65', '49', '44', '3e', '75', '72', '6e', '3a',
'75', '75', '69', '64', '3a', '30', '30', '34', '61', '35', '37', '34', '33', '2d', '30', '30',
'37', '32', '2d', '31', '30', '30', '61', '2d', '61', '38', '31', '35', '2d', '33', '30', '33',
'30', '33', '61', '33', '31', '33', '35', '33', '61', '3c', '2f', '77', '73', '61', '3a', '4d',
'65', '73', '73', '61', '67', '65', '49', '44', '3e', '3c', '77', '73', '61', '3a', '52', '65',
'6c', '61', '74', '65', '73', '54', '6f', '20', '52', '65', '6c', '61', '74', '69', '6f', '6e',
'73', '68', '69', '70', '54', '79', '70', '65', '3d', '22', '77', '73', '61', '3a', '52', '65',
'70', '6c', '79', '22', '3e', '75', '72', '6e', '3a', '75', '75', '69', '64', '3a', '30', '65',
'37', '64', '36', '66', '64', '35', '2d', '30', '65', '35', '66', '2d', '34', '35', '32', '63',
'2d', '62', '66', '61', '35', '2d', '31', '37', '34', '61', '34', '37', '37', '36', '33', '32',
'34', '37', '3c', '2f', '77', '73', '61', '3a', '52', '65', '6c', '61', '74', '65', '73', '54',
'6f', '3e', '3c', '77', '73', '64', '3a', '41', '70', '70', '53', '65', '71', '75', '65', '6e',
'63', '65', '20', '49', '6e', '73', '74', '61', '6e', '63', '65', '49', '64', '3d', '22', '30',
'22', '20', '4d', '65', '73', '73', '61', '67', '65', '4e', '75', '6d', '62', '65', '72', '3d',
'22', '31', '37', '33', '22', '3e', '3c', '2f', '77', '73', '64', '3a', '41', '70', '70', '53',
'65', '71', '75', '65', '6e', '63', '65', '3e', '3c', '2f', '73', '6f', '61', '70', '3a', '48',
'65', '61', '64', '65', '72', '3e', '3c', '73', '6f', '61', '70', '3a', '42', '6f', '64', '79',
'3e', '3c', '77', '73', '64', '3a', '52', '65', '73', '6f', '6c', '76', '65', '4d', '61', '74',
'63', '68', '65', '73', '3e', '3c', '77', '73', '64', '3a', '52', '65', '73', '6f', '6c', '76',
'65', '4d', '61', '74', '63', '68', '3e', '3c', '77', '73', '61', '3a', '45', '6e', '64', '70',
'6f', '69', '6e', '74', '52', '65', '66', '65', '72', '65', '6e', '63', '65', '3e', '3c', '77',
'73', '61', '3a', '41', '64', '64', '72', '65', '73', '73', '3e', '75', '72', '6e', '3a', '75',
'75', '69', '64', '3a', '31', '36', '61', '36', '35', '37', '30', '30', '2d', '30', '30', '37',
'63', '2d', '31', '30', '30', '30', '2d', '62', '62', '34', '39', '2d', '30', '30', '31', '35',
'39', '39', '61', '36', '38', '35', '65', '32', '3c', '2f', '77', '73', '61', '3a', '41', '64',
'64', '72', '65', '73', '73', '3e', '3c', '2f', '77', '73', '61', '3a', '45', '6e', '64', '70',
'6f', '69', '6e', '74', '52', '65', '66', '65', '72', '65', '6e', '63', '65', '3e', '3c', '77',
'73', '64', '3a', '54', '79', '70', '65', '73', '3e', '77', '73', '64', '70', '3a', '44', '65',
'76', '69', '63', '65', '20', '77', '70', '72', '74', '3a', '50', '72', '69', '6e', '74', '44',
'65', '76', '69', '63', '65', '54', '79', '70', '65', '20', '77', '73', '63', '6e', '3a', '53',
'63', '61', '6e', '44', '65', '76', '69', '63', '65', '54', '79', '70', '65', '3c', '2f', '77',
'73', '64', '3a', '54', '79', '70', '65', '73', '3e', '3c', '77', '73', '64', '3a', '53', '63',
'6f', '70', '65', '73', '3e', '3c', '2f', '77', '73', '64', '3a', '53', '63', '6f', '70', '65',
'73', '3e', '3c', '77', '73', '64', '3a', '58', '41', '64', '64', '72', '73', '3e', '68', '74',
'74', '70', '3a', '2f', '2f', '31', '37', '32', '2e', '31', '36', '2e', '31', '30', '2e', '31',
'37', '3a', '38', '30', '31', '38', '2f', '77', '73', '64', '3c', '2f', '77', '73', '64', '3a',
'58', '41', '64', '64', '72', '73', '3e', '3c', '77', '73', '64', '3a', '4d', '65', '74', '61',
'64', '61', '74', '61', '56', '65', '72', '73', '69', '6f', '6e', '3e', '33', '3c', '2f', '77',
'73', '64', '3a', '4d', '65', '74', '61', '64', '61', '74', '61', '56', '65', '72', '73', '69',
'6f', '6e', '3e', '3c', '2f', '77', '73', '64', '3a', '52', '65', '73', '6f', '6c', '76', '65',
'4d', '61', '74', '63', '68', '3e', '3c', '2f', '77', '73', '64', '3a', '52', '65', '73', '6f',
'6c', '76', '65', '4d', '61', '74', '63', '68', '65', '73', '3e', '3c', '2f', '73', '6f', '61',
'70', '3a', '42', '6f', '64', '79', '3e', '3c', '2f', '73', '6f', '61', '70', '3a', '45', '6e',
'76', '65', '6c', '6f', '70', '65', '3e'
]


def get_scapy_vxlan_udp_pkt( vxlan_smac_x, vxlan_dmac_x, vxlan_sip_x, vxlan_dip_x, vxlan_sport_x, vxlan_dport_x, vxlan_vni_x, guest_vlan_x, guest_prio_x, guest_sip_x, guest_dip_x, guest_sport_x, guest_dport_x, payload_x ):
	############################################################################################################################################
	scapy_vxlan_udp_pkt = Ether(src=vxlan_smac_x,dst=vxlan_dmac_x)/IP(proto=17,src=vxlan_sip_x,dst=vxlan_dip_x)/UDP(sport=vxlan_sport_x,dport=vxlan_dport_x)/VXLAN(vni=vxlan_vni_x)/Ether()/Dot1Q(vlan=guest_vlan_x,prio=guest_prio_x)/IP(src=guest_sip_x,dst=guest_dip_x,proto=17)/UDP(sport=guest_sport_x,dport=guest_dport_x)/Raw(load=payload_x)
	############################################################################################################################################
	return scapy_vxlan_udp_pkt;


pg_id_x = 12
payload_align_factor = 4
##########################
vxlan_vnis_count = (streams_count / (guest_vlans_count * guest_prios_count))
vxlan_vni_max = (vxlan_vni_min + vxlan_vnis_count)
guest_vlan_max = (guest_vlan_min + guest_vlans_count)
guest_prio_max = (guest_prio_min + guest_prios_count)
##########################
vxlan_eth_header_len = 14
vxlan_ip_header_len = 20
vxlan_udp_header_len = 8
vxlan_header_len = 8
##########################
guest_eth_header_len = 14
guest_ip_header_len = 20
guest_udp_header_len = 8
##########################
vxlan_headers_len = vxlan_eth_header_len + vxlan_ip_header_len + vxlan_udp_header_len + vxlan_header_len
guest_headers_len = guest_eth_header_len + guest_ip_header_len + guest_udp_header_len
guest_frame_len_min = 64
if (frame_len < (vxlan_headers_len + guest_frame_len_min)):
	frame_len = (vxlan_headers_len + guest_frame_len_min)
payload_len = frame_len - (vxlan_headers_len + guest_headers_len)
payload_len -= payload_align_factor
del ssdp_payload_list[payload_len:]
##########################
total_bps = total_Mbps * 1000000
total_pps = ((total_bps / 8) / frame_len)
pps_per_stream = (total_pps / streams_count)
##########################
ssdp_payload_raw = ''.join(ssdp_payload_list).decode('hex')
##########################
streams = []


##########################################################################################
# VXLAN Scapy extension:
##########################################################################################
_VXLAN_FLAGS = ['R' for i in range(0, 24)] + ['R', 'R', 'R', 'I', 'R', 'R', 'R', 'R', 'R']

class VXLAN(Packet):
    name = "VXLAN"
    fields_desc = [FlagsField("flags", 0x08000000, 32, _VXLAN_FLAGS),
                   ThreeBytesField("vni", 0),
                   XByteField("reserved", 0x00)]

    def mysummary(self):
        return self.sprintf("VXLAN (vni=%VXLAN.vni%)")

bind_layers(UDP, VXLAN, dport=4789)
bind_layers(VXLAN, Ether)
##########################################################################################


def get_vxlan_ssdp_pkt( vxlan_smac_x, vxlan_dmac_x, vxlan_sip_x, vxlan_dip_x, vxlan_sport_x, vxlan_vni_x, guest_vlan_x, guest_prio_x, guest_sip_x, guest_dip_x, guest_sport_x ):
	vxlan_ssdp_pkt = get_scapy_vxlan_udp_pkt( vxlan_smac_x, vxlan_dmac_x, vxlan_sip_x, vxlan_dip_x, vxlan_sport_x, 4789, vxlan_vni_x, guest_vlan_x, guest_prio_x, guest_sip_x, guest_dip_x, guest_sport_x, 1900, ssdp_payload_raw )
	return vxlan_ssdp_pkt;
	

####################
class STLS1(object):


	def __init__ (self):
		self.fsize  = 64; # the size of the packet

	def create_stream (self):

		stream_id = 0;
		for class_c_vtep_x in range(0, vxlan_vnis_count):
	
			vxlan_smac_y = "6a:5f:ee:92:00:00"
			vxlan_dmac_y = "CC:D3:9D:D1:00:07"
			vxlan_sip_y = "10.0.1.4"
			vtep_dip_min_y =                         10
			vtep_dip_min_y = (vtep_dip_min_y << 8) + 0
			vtep_dip_min_y = (vtep_dip_min_y << 8) + 2
			vtep_dip_min_y = (vtep_dip_min_y << 8) + 3

			##########################################
			tunnel_id = (stream_id % 4)
			lan_host_id = (5 + (stream_id / 4))
			vxlan_smac_y = "6a:5f:ee:92:%d:%d" % ((10 + tunnel_id), (10 + tunnel_id))

			##########################################
			if tunnel_id >= 15:
				vxlan_dmac_y = "CC:D3:9D:D1:4F:07"
			elif tunnel_id == 14:
				vxlan_dmac_y = "CC:D3:9D:D1:4E:07"
			elif tunnel_id == 13:
				vxlan_dmac_y = "CC:D3:9D:D1:4D:07"
			elif tunnel_id == 12:
				vxlan_dmac_y = "CC:D3:9D:D1:4C:07"
			elif tunnel_id == 11:
				vxlan_dmac_y = "CC:D3:9D:D1:4B:07"
			elif tunnel_id == 10:
				vxlan_dmac_y = "CC:D3:9D:D1:4A:07"
			else:
				vxlan_dmac_y = "CC:D3:9D:D1:4%d:07" % (tunnel_id)
			##########################################
			vxlan_sip_y = "%d.0.1.%d" % ((10 + tunnel_id), lan_host_id)
			##########################################
			vtep_dip_min_y =                        (10 + tunnel_id)
			vtep_dip_min_y = (vtep_dip_min_y << 8) + 0
			vtep_dip_min_y = (vtep_dip_min_y << 8) + 2
			vtep_dip_min_y = (vtep_dip_min_y << 8) + 4
			##########################################

			vxlan_smac_x = vxlan_smac_y
			vxlan_dmac_x = vxlan_dmac_y
			vxlan_sip_x = vxlan_sip_y
			vtep_dip_min = vtep_dip_min_y
				
				#vxlan_sip_x = "172.1.1.%d" % (1 + (class_c_vtep_x % 128))
			guest_sport_x = 3000
			for guest_vlan_x in range(guest_vlan_min, guest_vlan_max):
				for guest_prio_x in range(guest_prio_min, guest_prio_max):
					#############################################
					ip_num = vtep_dip_min + (stream_id % vtep_dips_count)
					vtep_dip3 = (1 + ((ip_num & 255) % 254))
					ip_num = (ip_num >> 8)
					vtep_dip2 = (ip_num & 255)
					ip_num = (ip_num >> 8)
					vtep_dip1 = (ip_num & 255)
					ip_num = (ip_num >> 8)
					vtep_dip0 = (ip_num & 255)
					vtep_dip_x = "%d.%d.%d.%d" % (vtep_dip0, vtep_dip1, vtep_dip2, vtep_dip3)
					#vxlan_dmac_x = '00:e0:ed:39:95:76'
					#############################################
					#vxlan_smac_x = '00:e0:%02x:5c:0f:21' % (256 - (vtep_dip2 + 1))
					#vxlan_dmac_x = '00:%02x:%02x:%02x:0f:22' % ((256 - (vtep_dip0 + 1)), (256 - (vtep_dip1 + 1)), (256 - (vtep_dip2 + 1)))
					#vxlan_dmac_x = '00:%02x:%02x:%02x:0f:22' % ((256 - (vtep_dip0 + 1)), (256 - (vtep_dip1 + 1)), 255)
					#############################################
					ip_num = guest_sip_min + (stream_id % guest_sips_count)
					guest_sip3 = (1 + ((ip_num & 255) % 254))
					ip_num = (ip_num >> 8)
					guest_sip2 = (ip_num & 255)
					ip_num = (ip_num >> 8)
					guest_sip1 = (ip_num & 255)
					ip_num = (ip_num >> 8)
					guest_sip0 = (ip_num & 255)
					guest_sip_x = "%d.%d.%d.%d" % (guest_sip0, guest_sip1, guest_sip2, guest_sip3)
					#############################################
					ip_num = guest_dip_min + (stream_id % guest_dips_count)
					guest_dip3 = (1 + ((ip_num & 255) % 254))
					ip_num = (ip_num >> 8)
					guest_dip2 = (ip_num & 255)
					ip_num = (ip_num >> 8)
					guest_dip1 = (ip_num & 255)
					ip_num = (ip_num >> 8)
					guest_dip0 = (ip_num & 255)
					guest_dip_x = "%d.%d.%d.%d" % (guest_dip0, guest_dip1, guest_dip2, guest_dip3)
					#############################################
					vxlan_vni_x = (vxlan_vni_min + stream_id)
					vxlan_ssdp_pkt = get_vxlan_ssdp_pkt(vxlan_smac_x, vxlan_dmac_x, vxlan_sip_x, vtep_dip_x, 1337, vxlan_vni_x, guest_vlan_x, guest_prio_x, guest_sip_x, guest_dip_x, guest_sport_x)
					guest_sport_x += 1
					
					if stream_id == 0:
						streams.append(STLStream(
							isg = 2.0,
							packet  = STLPktBuilder(pkt = vxlan_ssdp_pkt ,vm = []),
							#flow_stats = STLFlowLatencyStats(pg_id = pg_id_x),
							mode    = STLTXCont( pps = pps_per_stream),
						))
					else:
						streams.append(STLStream(
							isg = 2.0,
							packet  = STLPktBuilder(pkt = vxlan_ssdp_pkt ,vm = []),
							mode    = STLTXCont( pps = pps_per_stream),
							))
						
					stream_id += 1
					if stream_id >= streams_count:
						break
				if stream_id >= streams_count:
					break
			if stream_id >= streams_count:
				break

		return STLProfile(streams).get_streams()


	def get_streams (self, direction = 0, **kwargs):
		return self.create_stream()


# dynamic load - used for trex console or simulator
def register():
    return STLS1()


